import type { Octokit } from "@octokit/rest";

/**
 * Output of the README extractor. All fields are null/empty safe so the
 * caller can treat a missing README as a non-error (the sync loop
 * continues with empty descriptions + stack).
 *
 * `readmeSha` is the GitHub blob SHA of the README file — included in
 * the source_hash so edits to the README (PT or EN sides) trigger
 * re-extraction on the next sync.
 *
 * Bilingual shape (when `## English` is present):
 *   - `descriptionPt` = first paragraph under the h1, stopping at the
 *     first `##` (so the PT-BR block is everything above `## English`).
 *   - `descriptionEn` = first paragraph inside the `## English` block,
 *     after a `### <ProjectName>` heading; falls back to the first
 *     non-empty line if no `###` heading is present.
 * Monolingual shape (no `## English`):
 *   - `descriptionPt` = current behaviour (h1 + first paragraph).
 *   - `descriptionEn` = null.
 * `stack` is parsed from the FIRST `## Stack` heading (PT side); the
 * EN-side `### Stack` sits under `## English` and is ignored because the
 * parser stops at the `## English` boundary when looking for stack.
 */
export type ReadmeExtraction = {
  descriptionPt: string | null;
  descriptionEn: string | null;
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
 * Fetch a repo's README via the GitHub API, parse PT-BR + EN descriptions
 * and the `## Stack` bullet list. Returns empty/null fields on any
 * non-fatal condition (missing README, parse miss, API 404). Throws only
 * on unexpected API errors — the caller wraps in try/catch so one repo
 * cannot abort the whole sync.
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
    return { descriptionPt: null, descriptionEn: null, stack: [], readmeSha: null };
  }

  // Strip UTF-8 BOM if present, normalize line endings.
  const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");

  // Bilingual split: everything above `## English` is the PT section, the
  // rest (including the heading) is the EN section. When the heading is
  // absent, ptLines === lines and enLines === [].
  const englishIndex = findEnglishHeadingIndex(lines);
  const ptLines = englishIndex === -1 ? lines : lines.slice(0, englishIndex);
  const enLines = englishIndex === -1 ? [] : lines.slice(englishIndex);

  const descriptionPt = parseDescription(ptLines);
  const descriptionEn = englishIndex === -1 ? null : parseEnglishDescription(enLines);
  // Stack parsing is scoped to the PT side so the bilingual EN `### Stack`
  // cannot accidentally win. Legacy monolingual READMEs still parse the
  // same way (ptLines === lines).
  const stack = parseStack(ptLines);

  return { descriptionPt, descriptionEn, stack, readmeSha };
}

/**
 * Locate the `## English` heading (case-insensitive match on a line that
 * contains only `## English` modulo trailing whitespace). Returns -1 when
 * the README is monolingual.
 */
function findEnglishHeadingIndex(lines: string[]): number {
  return lines.findIndex((line) => /^##\s+English\s*$/i.test(line));
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

  return joinParagraph(paragraph);
}

/**
 * Extract the EN description from the slice of lines that starts with
 * `## English`.
 *
 * Primary shape (current README convention):
 *
 *   ## English
 *
 *   <first paragraph>
 *
 *   ### Features
 *   - ...
 *
 * Legacy shape (fallback only):
 *
 *   ## English
 *
 *   ### <ProjectName>
 *
 *   <first paragraph>
 *
 * The primary path captures the paragraph sitting between `## English`
 * and the next heading at any level. The `### <ProjectName>` subheading
 * scan is preserved verbatim as a fallback for legacy READMEs that
 * started the EN block with a project subheading and no leading
 * paragraph. Returns null when neither path yields a paragraph.
 */
function parseEnglishDescription(enLines: string[]): string | null {
  if (enLines.length === 0) return null;

  // --- Primary path: paragraph between `## English` and the next heading.
  // Skip the `## English` heading itself.
  let i = 1;
  // Skip blank lines between the heading and the first paragraph line.
  while (i < enLines.length && enLines[i].trim() === "") i++;

  const primaryParagraph: string[] = [];
  while (i < enLines.length) {
    const line = enLines[i];
    const trimmed = line.trim();
    // Stop at next heading (any level) or blank line terminating the paragraph.
    if (trimmed === "" || /^#{1,6}\s/.test(trimmed)) break;
    primaryParagraph.push(trimmed);
    i++;
  }

  if (primaryParagraph.length > 0) {
    return joinParagraph(primaryParagraph);
  }

  // --- Fallback path (legacy): `### <ProjectName>` subheading scan.
  // The regex search is bounded to the first 8 lines after the heading
  // so a malformed README cannot force a long scan.
  let j = 1;
  const scanLimit = Math.min(enLines.length, j + 8);
  let subheadingIndex = -1;
  for (let k = j; k < scanLimit; k++) {
    if (/^###\s+\S/.test(enLines[k])) {
      subheadingIndex = k;
      break;
    }
  }

  if (subheadingIndex !== -1) {
    j = subheadingIndex + 1;
  }

  // Skip blank lines between the anchor (### heading or ## English) and
  // the first paragraph line.
  while (j < enLines.length && enLines[j].trim() === "") j++;

  const fallbackParagraph: string[] = [];
  while (j < enLines.length) {
    const line = enLines[j];
    const trimmed = line.trim();
    // Stop at next heading or blank line terminating the paragraph.
    if (trimmed === "" || /^#{1,6}\s/.test(trimmed)) break;
    fallbackParagraph.push(trimmed);
    j++;
  }

  return joinParagraph(fallbackParagraph);
}

/**
 * Collapse a captured paragraph into a single whitespace-normalized,
 * length-capped string. Shared by PT and EN paths so both obey
 * MAX_DESCRIPTION_LENGTH identically.
 */
function joinParagraph(paragraph: string[]): string | null {
  if (paragraph.length === 0) return null;

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
