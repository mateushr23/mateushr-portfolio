/**
 * Returns the URL string only if it parses cleanly AND uses an http(s)
 * protocol. Anything else (javascript:, data:, malformed, empty, null)
 * returns `undefined` so callers can fall back to a safe href.
 *
 * Consumed by IndexRow (public site) and AdminRepoRow (admin) — both
 * render anchors pointing at user-controlled repo URLs, so we want a
 * single scheme guard rather than trusting the DB.
 */
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

// Alias kept for call sites that read more naturally as a repo-specific helper.
export const safeRepoHref = safeHref;
