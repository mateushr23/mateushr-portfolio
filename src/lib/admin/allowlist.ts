import "server-only";

/**
 * Server-only allowlist check for admin access.
 *
 * Reads `SUPABASE_ADMIN_ALLOWLIST` (comma-separated) at call time — not at
 * module load — so Vercel env-var updates don't require a redeploy of this
 * module (the function is re-evaluated per request on dynamic routes).
 *
 * Case-insensitive compare; whitespace around entries is trimmed. Returns
 * false for empty / null / undefined input or when the env var is unset.
 *
 * NEVER import from client code. `import "server-only"` throws at bundle
 * time if anything under `app/` marked `'use client'` pulls this in.
 */
export function isAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;

  const raw = process.env.SUPABASE_ADMIN_ALLOWLIST;
  if (!raw) return false;

  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const entries = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  return entries.includes(normalized);
}

/**
 * Redact an email for log output. Returns the first local-part character
 * plus "...@domain". Safe to emit in server logs — never log the raw email.
 */
export function redactEmail(email: string | null | undefined): string {
  if (!email) return "<none>";
  const [local, domain] = email.split("@");
  if (!local || !domain) return "<malformed>";
  const head = local.slice(0, 1);
  return `${head}...@${domain}`;
}
