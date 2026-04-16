import { Octokit } from "@octokit/rest";

/**
 * Normalized shape consumed by the sync pipeline. Matches the subset of
 * GitHub fields we persist to Supabase, plus `topics` (used to compute
 * the source_hash and to feed the Claude describe step).
 */
export type NormalizedRepo = {
  github_id: number;
  name: string;
  url: string;
  description_gh: string | null;
  topics: string[];
  language: string | null;
  stars: number;
  pushed_at: string;
};

/**
 * Lazily-constructed Octokit instance. We avoid instantiating at module
 * scope so that importing this file in a context without GITHUB_TOKEN
 * (e.g. a linter) does not throw.
 */
function createOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN env var.");
  }
  return new Octokit({ auth: token });
}

/**
 * Fetch all public, owner-type, non-archived, non-fork repos for the
 * given GitHub username. Paginates until exhausted.
 *
 * Topics: the REST `listForUser` endpoint includes a `topics` field on
 * the full Repository response. When it is missing (some older Octokit
 * paths return a MinimalRepository), we fall back to
 * `listTopicsForRepo` per affected repo. For a portfolio of <50 repos
 * the extra requests are negligible.
 */
export async function fetchPublicRepos(username: string): Promise<NormalizedRepo[]> {
  if (!username) {
    throw new Error("fetchPublicRepos: username is required.");
  }

  const octokit = createOctokit();

  const rawRepos = await octokit.paginate(octokit.rest.repos.listForUser, {
    username,
    type: "owner",
    sort: "pushed",
    direction: "desc",
    per_page: 100,
  });

  const visible = rawRepos.filter(
    (repo) => repo.private === false && repo.fork === false && repo.archived === false
  );

  const normalized: NormalizedRepo[] = [];

  for (const repo of visible) {
    // listForUser should include topics on modern Octokit, but guard
    // against it being undefined (MinimalRepository shape).
    let topics: string[] | undefined = (repo as { topics?: string[] }).topics;

    if (!Array.isArray(topics)) {
      try {
        const { data } = await octokit.rest.repos.getAllTopics({
          owner: username,
          repo: repo.name,
        });
        topics = data.names ?? [];
      } catch (err) {
        console.error(
          `fetchPublicRepos: failed to fetch topics for ${repo.name} (id=${repo.id})`,
          err
        );
        topics = [];
      }
    }

    normalized.push({
      github_id: repo.id,
      name: repo.name,
      url: repo.html_url,
      description_gh: repo.description ?? null,
      topics,
      language: repo.language ?? null,
      stars: repo.stargazers_count ?? 0,
      pushed_at: repo.pushed_at ?? new Date(0).toISOString(),
    });
  }

  return normalized;
}
