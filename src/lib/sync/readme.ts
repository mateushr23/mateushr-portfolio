import type { Octokit } from "@octokit/rest";

/**
 * Output of the README extractor. All fields are null/empty safe so the
 * caller can treat a missing README as a non-error (the sync loop
 * continues with empty description + stack).
 *
 * `readmeSha` is the GitHub blob SHA of the README file — included in
 * the source_hash so edits to the README trigger re-extraction on the
 * next sync.
 */
export type ReadmeExtraction = {
  description: string | null;
  stack: string[];
  readmeSha: string | null;
};

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_STACK_ITEMS = 20;
const MAX_TOKEN_LENGTH = 40;

// Stack heading aliases. First match wins. The primary `## Stack` is
// case-sensitive to match our README convention; fallbacks are
// case-insensitive.
const STACK_HEADING_ALIASES = ["Stack", "Tech Stack", "Tech"];

/**
 * Fetch a repo's README via the GitHub API, parse the h1+paragraph as
 * the description and the `## Stack` bullet list as the stack tokens.
 * Returns empty/null fields on any non-fatal condition (missing README,
 * parse miss, API 404). Throws only on unexpected API errors — caller
 * wraps in try/catch so one repo cannot abort the whole sync.
 */
export async function extractFromReadme(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<ReadmeExtraction> {
  let content: string;
  let readmeSha: string | null;

  try {
    const { data } = await octokit.repos.getReadme({ owner, repo });
    // getReadme always returns base64-encoded content; decode once.
    content = Buffer.from(data.content, data.encoding as BufferEncoding).toString("utf8");
    readmeSha = data.sha ?? null;
  } catch (err) {
    // 404 = no README. Any other API error is also non-fatal here —
    // treat as "no README available" so the sync loop keeps going.
    const status = (err as { status?: number }).status;
    if (status !== 404) {
      console.warn(`extractFromReadme: ${owner}/${repo} failed with status=${status ?? "?"}`);
    }
    return { description: null, stack: [], readmeSha: null };
  }

  // Strip UTF-8 BOM if present, normalize line endings.
  const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");

  const description = parseDescription(lines);
  const stack = parseStack(lines);

  return { description, stack, readmeSha };
}

/**
 * Find the first h1 (`# ...`), skip blank lines, capture the next
 * consecutive non-empty paragraph until another heading or EOF.
 * Returns null when no suitable paragraph is found.
 */
function parseDescription(lines: string[]): string | null {
  const h1Index = lines.findIndex((line) => /^#\s+\S/.test(line));
  if (h1Index === -1) return null;

  let i = h1Index + 1;
  // Skip blank lines between h1 and the tagline paragraph.
  while (i < lines.length && lines[i].trim() === "") i++;

  const paragraph: string[] = [];
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    // Stop at next heading or blank line terminating the paragraph.
    if (trimmed === "" || /^#{1,6}\s/.test(trimmed)) break;
    paragraph.push(trimmed);
    i++;
  }

  if (paragraph.length === 0) return null;

  // Collapse internal newlines to spaces, squeeze whitespace.
  let text = paragraph.join(" ").replace(/\s+/g, " ").trim();
  if (text === "") return null;

  if (text.length > MAX_DESCRIPTION_LENGTH) {
    text = text.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd() + "…";
  }

  return text;
}

/**
 * Locate a `## Stack` (or alias) section and extract bullet-list tokens.
 * Returns [] when no section is found or when all bullets are empty.
 */
function parseStack(lines: string[]): string[] {
  const startIndex = findStackHeadingIndex(lines);
  if (startIndex === -1) return [];

  const bullets: string[] = [];
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    // Stop at the next level-2+ heading.
    if (/^#{1,6}\s/.test(line.trim())) break;
    // Match bullets: `- ...`, `* ...`, `+ ...` with optional leading
    // whitespace. Restricted to 0-3 leading spaces to avoid matching
    // code blocks.
    const bulletMatch = /^ {0,3}[-*+]\s+(.+)$/.exec(line);
    if (bulletMatch) bullets.push(bulletMatch[1]);
  }

  const tokens: string[] = [];
  for (const bullet of bullets) {
    const extracted = extractTokensFromBullet(bullet);
    for (const token of extracted) {
      if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) continue;
      tokens.push(token);
    }
  }

  // Dedupe case-insensitively, preserve first-seen order.
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(token);
    if (deduped.length >= MAX_STACK_ITEMS) break;
  }

  return deduped;
}

function findStackHeadingIndex(lines: string[]): number {
  // Exact match first: case-sensitive `## Stack`.
  const exactIdx = lines.findIndex((line) => /^##\s+Stack\s*$/.test(line));
  if (exactIdx !== -1) return exactIdx;

  // Fallback: case-insensitive aliases.
  return lines.findIndex((line) => {
    const match = /^##\s+(.+?)\s*$/.exec(line);
    if (!match) return false;
    const heading = match[1].trim().toLowerCase();
    return STACK_HEADING_ALIASES.some((alias) => alias.toLowerCase() === heading);
  });
}

/**
 * Turn a single bullet payload into one or more tech tokens.
 *
 * Handles these bullet shapes:
 *   `**Frontend:** Next.js 16, React 19, Tailwind v4`
 *   `**Frontend** — Next.js 16`
 *   `**Next.js**`                                   (no separator → keep term)
 *   `Next.js, React 19`                             (plain CSV)
 *
 * When a bold label + separator is present, the RIGHT side (actual tech
 * names) is used. Tokens are split on `,`, ` + `, ` and `, then stripped
 * of markdown (`**`, backticks), trailing/leading punctuation, and
 * parenthetical/italic explanations.
 */
function extractTokensFromBullet(bullet: string): string[] {
  const stripped = bullet.trim();

  // Classify the bullet shape. Two common idioms in our READMEs:
  //
  //   (A) Category + tech list:   `**Frontend:** Next.js, React`
  //                               `**Frontend** — Next.js, React`
  //       → Use the RIGHT side (actual tech names). The bold label is a
  //         category, not a tech.
  //
  //   (B) Tech + context blurb:   `**Next.js 16** — App Router, TS strict`
  //       → Use the BOLD label (it IS the tech). The right side is free
  //         prose, not a list of techs.
  //
  // Disambiguation heuristic:
  //   - If the separator is `:` (or the label ends with `:` inside bold),
  //     it's shape (A) — right side.
  //   - Otherwise (em-dash, en-dash, hyphen), it's shape (B) — bold label.
  //
  // All regexes are anchored, non-nested, and bounded — ReDoS-safe.
  let payload: string;
  const colonInsideBold = /^\*\*([^*]+?):\s*\*\*\s*(.+)$/.exec(stripped);
  const colonOutsideBold = /^\*\*([^*]+)\*\*\s*:\s*(.+)$/.exec(stripped);
  const dashOutsideBold = /^\*\*([^*]+)\*\*\s*[—–-]\s*.+$/.exec(stripped);
  const boldOnly = /^\*\*([^*]+)\*\*\s*$/.exec(stripped);

  if (colonInsideBold) {
    payload = colonInsideBold[2];
  } else if (colonOutsideBold) {
    payload = colonOutsideBold[2];
  } else if (dashOutsideBold) {
    // Shape (B): bold term IS the tech name. Right side is blurb — discard.
    payload = dashOutsideBold[1];
  } else if (boldOnly) {
    payload = boldOnly[1];
  } else {
    // No "label ... payload" shape. Use the whole line.
    payload = stripped;
  }

  // Split on common separators.
  const raw = payload.split(/,|\s+\+\s+|\s+and\s+/);

  const out: string[] = [];
  for (const piece of raw) {
    const cleaned = cleanToken(piece);
    if (cleaned) out.push(cleaned);
  }
  return out;
}

function cleanToken(token: string): string {
  let t = token.trim();
  // Remove parenthetical explanations: `Groq API (llama-3.3)` → `Groq API`.
  t = t.replace(/\s*\([^)]*\)/g, "");
  // Strip markdown bold/italic markers.
  t = t.replace(/\*\*/g, "").replace(/__/g, "");
  t = t.replace(/(^|[^*])\*(?!\*)/g, "$1").replace(/(^|[^_])_(?!_)/g, "$1");
  // Strip inline code backticks.
  t = t.replace(/`/g, "");
  // Strip surrounding brackets/quotes and trailing punctuation.
  t = t.replace(/^["'[\]<>]+|["'[\]<>]+$/g, "");
  t = t.replace(/[,.;:—–-]+$/g, "");
  // Collapse whitespace.
  t = t.replace(/\s+/g, " ").trim();
  return t;
}
