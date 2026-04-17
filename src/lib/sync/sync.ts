import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

import { createOctokit, fetchPublicRepos, type NormalizedRepo } from "./github";
import { extractFromReadme, type ReadmeExtraction } from "./readme";

export type SyncCounters = {
  inserted: number;
  updated: number;
  hidden: number;
  regenerated: number;
  missing_readme: number;
  total: number;
};

/**
 * Compute the source fingerprint. Any change in name, GitHub-side
 * description, topics, primary language, or README blob SHA flips the
 * hash and triggers README re-extraction on the next sync.
 *
 * Topics are sorted + joined to keep the hash stable against GitHub's
 * ordering quirks. When the repo has no README, the literal
 * "no-readme" is used so a README being *added* later still flips the
 * hash (null → "no-readme" → real-sha all compare distinct).
 */
function computeSourceHash(repo: NormalizedRepo, readmeSha: string | null): string {
  const topicsCsv = [...repo.topics].sort().join(",");
  const payload = [
    repo.name,
    repo.description_gh ?? "",
    topicsCsv,
    repo.language ?? "",
    readmeSha ?? "no-readme",
  ].join("|");

  return createHash("sha256").update(payload).digest("hex");
}

type ExistingRow = {
  github_id: number;
  source_hash: string | null;
  description_ai: string | null;
  stack: string[] | null;
};

/**
 * Full sync entrypoint. Pulls the current GitHub snapshot, extracts
 * `description` + `stack` directly from each repo's README, diffs
 * against Supabase via `source_hash`, and marks no-longer-returned
 * repos as hidden (never deletes).
 *
 * Note: `description_ai` column kept for zero-migration compatibility;
 * semantics are now "description from README" (the first paragraph
 * under the h1). The column may be renamed in a follow-up migration.
 *
 * Returns counters for observability / route response.
 */
export async function syncRepos(): Promise<SyncCounters> {
  const username = process.env.GITHUB_USERNAME;
  if (!username) {
    throw new Error("Missing GITHUB_USERNAME env var.");
  }

  const admin = createAdminClient();
  const octokit = createOctokit();

  // 1. Fetch fresh GitHub snapshot.
  const freshRepos = await fetchPublicRepos(octokit, username);

  // 2. Load existing rows to drive the insert/update/hidden decision.
  const { data: existingRows, error: loadError } = await admin
    .from("repos")
    .select("github_id, source_hash, description_ai, stack");

  if (loadError) {
    throw new Error(`syncRepos: failed to load existing repos — ${loadError.message}`);
  }

  const existingMap = new Map<number, ExistingRow>();
  for (const row of existingRows ?? []) {
    existingMap.set(row.github_id, row);
  }

  const counters: SyncCounters = {
    inserted: 0,
    updated: 0,
    hidden: 0,
    regenerated: 0,
    missing_readme: 0,
    total: freshRepos.length,
  };

  const freshIds = new Set<number>();

  // 3. Upsert each fresh repo.
  for (const repo of freshRepos) {
    freshIds.add(repo.github_id);

    try {
      // README extraction is needed to compute the source_hash, but we
      // defer the DB write logic until after we know whether the hash
      // changed. Extraction is always called (~1 request/repo) so that
      // README edits — which don't show up in listForUser — trigger
      // regeneration on the next sync.
      const extraction: ReadmeExtraction = await extractFromReadme(octokit, username, repo.name);

      if (extraction.description === null) {
        counters.missing_readme += 1;
      }

      const sourceHash = computeSourceHash(repo, extraction.readmeSha);
      const existing = existingMap.get(repo.github_id);
      const isNew = !existing;

      const hashMatches = !!existing && existing.source_hash === sourceHash;
      const shouldRegenerate = !hashMatches;

      if (shouldRegenerate) {
        counters.regenerated += 1;
      }

      const description_ai: string | null = shouldRegenerate
        ? extraction.description
        : (existing?.description_ai ?? null);
      const stack: string[] = shouldRegenerate ? extraction.stack : (existing?.stack ?? []);

      if (isNew) {
        // Insert path — include description_ai, stack, and source_hash;
        // let DB defaults handle is_featured=false, is_hidden=false.
        const { error: insertError } = await admin.from("repos").insert({
          github_id: repo.github_id,
          name: repo.name,
          url: repo.url,
          description_ai,
          stack,
          language: repo.language,
          stars: repo.stars,
          pushed_at: repo.pushed_at,
          source_hash: sourceHash,
        });

        if (insertError) {
          throw new Error(`insert failed — ${insertError.message}`);
        }
        counters.inserted += 1;
      } else {
        // Update path — match by github_id. Do NOT touch is_featured so
        // admin curation is preserved. is_hidden is force-reset to false
        // because the repo is in the fresh set (it reappeared or was
        // always visible). description_ai + stack are only overwritten
        // when the hash flipped, to avoid churning every sync.
        const updatePayload: {
          name: string;
          url: string;
          language: string | null;
          stars: number;
          pushed_at: string;
          source_hash: string;
          is_hidden: boolean;
          description_ai?: string | null;
          stack?: string[];
        } = {
          name: repo.name,
          url: repo.url,
          language: repo.language,
          stars: repo.stars,
          pushed_at: repo.pushed_at,
          source_hash: sourceHash,
          is_hidden: false,
        };

        if (shouldRegenerate) {
          updatePayload.description_ai = description_ai;
          updatePayload.stack = stack;
        }

        const { error: updateError } = await admin
          .from("repos")
          .update(updatePayload)
          .eq("github_id", repo.github_id);

        if (updateError) {
          throw new Error(`update failed — ${updateError.message}`);
        }
        counters.updated += 1;
      }
    } catch (err) {
      // Log + continue — one bad repo should not abort the whole sync.
      console.error(
        `syncRepos: failure for repo github_id=${repo.github_id} name=${repo.name}`,
        err
      );
    }
  }

  // 4. Hide repos present in DB but missing from the fresh snapshot.
  const missingIds: number[] = [];
  for (const id of existingMap.keys()) {
    if (!freshIds.has(id)) missingIds.push(id);
  }

  if (missingIds.length > 0) {
    const { error: hideError, count } = await admin
      .from("repos")
      .update({ is_hidden: true }, { count: "exact" })
      .in("github_id", missingIds)
      .eq("is_hidden", false); // only count rows that actually changed

    if (hideError) {
      console.error("syncRepos: failed to hide missing repos", hideError);
    } else {
      counters.hidden = count ?? missingIds.length;
    }
  }

  return counters;
}
