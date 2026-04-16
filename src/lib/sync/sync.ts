import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

import { generateDescription } from "./describe";
import { fetchPublicRepos, type NormalizedRepo } from "./github";

export type SyncCounters = {
  inserted: number;
  updated: number;
  hidden: number;
  regenerated: number;
  skipped_description: number;
  total: number;
};

/**
 * Compute the source fingerprint. Any change in name, GitHub-side
 * description, topics, or primary language flips the hash and triggers
 * Claude re-description on the next sync.
 *
 * Topics are sorted + joined to keep the hash stable against GitHub's
 * ordering quirks.
 */
function computeSourceHash(repo: NormalizedRepo): string {
  const topicsCsv = [...repo.topics].sort().join(",");
  const payload = [repo.name, repo.description_gh ?? "", topicsCsv, repo.language ?? ""].join("|");

  return createHash("sha256").update(payload).digest("hex");
}

type ExistingRow = {
  github_id: number;
  source_hash: string | null;
  description_ai: string | null;
};

/**
 * Full sync entrypoint. Pulls the current GitHub snapshot, diffs against
 * Supabase via `source_hash`, regenerates Claude descriptions only when
 * the underlying signal changed, and marks no-longer-returned repos as
 * hidden (never deletes).
 *
 * Returns counters for observability / route response.
 */
export async function syncRepos(): Promise<SyncCounters> {
  const username = process.env.GITHUB_USERNAME;
  if (!username) {
    throw new Error("Missing GITHUB_USERNAME env var.");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "syncRepos: ANTHROPIC_API_KEY not set — AI descriptions will be skipped this run."
    );
  }

  const admin = createAdminClient();

  // 1. Fetch fresh GitHub snapshot.
  const freshRepos = await fetchPublicRepos(username);

  // 2. Load existing rows to drive the insert/update/hidden decision.
  const { data: existingRows, error: loadError } = await admin
    .from("repos")
    .select("github_id, source_hash, description_ai");

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
    skipped_description: 0,
    total: freshRepos.length,
  };

  const freshIds = new Set<number>();

  // 3. Upsert each fresh repo.
  for (const repo of freshRepos) {
    freshIds.add(repo.github_id);

    try {
      const sourceHash = computeSourceHash(repo);
      const existing = existingMap.get(repo.github_id);
      const isNew = !existing;

      const hashMatches = !!existing && existing.source_hash === sourceHash;
      const hasDescription = !!existing?.description_ai;
      const shouldRegenerate = !hashMatches || !hasDescription;

      let description_ai: string | null = existing?.description_ai ?? null;

      if (shouldRegenerate) {
        const newDescription = await generateDescription({
          name: repo.name,
          description_gh: repo.description_gh,
          topics: repo.topics,
          language: repo.language,
        });

        if (newDescription !== null) {
          description_ai = newDescription;
          counters.regenerated += 1;
        } else {
          // Claude skipped (missing key or API error). Keep the previous
          // description (if any) so we don't wipe a real value; the
          // source_hash still updates below so a future run with the key
          // present will only regenerate on real signal changes.
          counters.skipped_description += 1;
        }
      }

      if (isNew) {
        // Insert path — include description_ai and source_hash; let DB
        // defaults handle is_featured=false, is_hidden=false.
        const { error: insertError } = await admin.from("repos").insert({
          github_id: repo.github_id,
          name: repo.name,
          url: repo.url,
          description_ai,
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
        // always visible).
        const updatePayload: {
          name: string;
          url: string;
          language: string | null;
          stars: number;
          pushed_at: string;
          source_hash: string;
          is_hidden: boolean;
          description_ai?: string | null;
        } = {
          name: repo.name,
          url: repo.url,
          language: repo.language,
          stars: repo.stars,
          pushed_at: repo.pushed_at,
          source_hash: sourceHash,
          is_hidden: false,
        };

        if (shouldRegenerate && description_ai !== null) {
          updatePayload.description_ai = description_ai;
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
