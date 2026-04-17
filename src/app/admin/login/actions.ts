"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isAllowlisted, redactEmail } from "@/lib/admin/allowlist";
import { createClient } from "@/lib/supabase/server";

export type MagicLinkState = {
  ok: boolean;
  error?:
    | "login_error_invalid"
    | "login_error_rate_limit"
    | "login_error_provider_rate_limit"
    | "login_error_generic";
};

// Supabase may signal a provider-side send-rate-limit either via HTTP 429
// (AuthApiError.status) or via a string code like `over_email_send_rate_limit`
// (newer) / `email_send_rate_limit_exceeded` (older). We sniff both shapes.
function isProviderRateLimit(err: unknown): boolean {
  if (err === null || typeof err !== "object") return false;
  const e = err as { status?: number; code?: string };
  if (e.status === 429) return true;
  const code = typeof e.code === "string" ? e.code.toLowerCase() : "";
  return code.includes("rate_limit") || code.includes("rate-limit");
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

// Timing equalizer — both allowlisted and non-allowlisted branches are
// clamped to a comparable window so a statistical attacker can't
// distinguish allowlist membership from latency over many samples.
//   - Non-allowlisted: random jitter in [MIN, MAX]
//   - Allowlisted: Supabase call is raced against a fixed MIN floor so the
//     real branch never responds faster than the decoy branch's lower bound
const TIMING_EQUALIZER_MIN_MS = 500;
const TIMING_EQUALIZER_MAX_MS = 700;
const TIMING_EQUALIZER_FLOOR_MS = 600;

function randomEqualizerDelay(): number {
  const span = TIMING_EQUALIZER_MAX_MS - TIMING_EQUALIZER_MIN_MS;
  return TIMING_EQUALIZER_MIN_MS + Math.floor(Math.random() * (span + 1));
}

// Simple in-memory rate limit. Acceptable because the allowlist is
// single-admin and the function runtime is generally long-lived per Vercel
// lambda warm period. Two independent buckets:
//   - per-email: 5 requests / 15 min (catches targeted brute force)
//   - per-IP:   20 requests / 15 min (catches rotation attacks where the
//     attacker cycles email variants to bypass the per-email cap)
// If EITHER bucket is exceeded, the caller is rate-limited. Entries whose
// window has fully expired are pruned opportunistically on every check so
// the Map can't leak memory across a long-running lambda.
// NOTE: upgrade to a shared KV store when the deployment fans out to
// multiple warm lambdas — see Stage 4c open questions.
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_EMAIL = 5;
const RATE_LIMIT_IP = 20;
const rateMapEmail = new Map<string, number[]>();
const rateMapIp = new Map<string, number[]>();

function pruneAndFilter(map: Map<string, number[]>, key: string, now: number): number[] {
  // Opportunistic sweep: drop keys whose most recent attempt is fully
  // outside the window. O(n) over the map per check, but n is tiny in
  // single-admin scope.
  for (const [k, entries] of map) {
    const last = entries[entries.length - 1] ?? 0;
    if (now - last >= RATE_WINDOW_MS) {
      map.delete(k);
    }
  }
  const entries = map.get(key) ?? [];
  return entries.filter((ts) => now - ts < RATE_WINDOW_MS);
}

function underRateLimit(emailKey: string, ipKey: string): boolean {
  const now = Date.now();

  const recentEmail = pruneAndFilter(rateMapEmail, emailKey, now);
  if (recentEmail.length >= RATE_LIMIT_EMAIL) {
    rateMapEmail.set(emailKey, recentEmail);
    return false;
  }

  const recentIp = pruneAndFilter(rateMapIp, ipKey, now);
  if (recentIp.length >= RATE_LIMIT_IP) {
    rateMapIp.set(ipKey, recentIp);
    // Still record the email attempt to keep the two buckets consistent.
    recentEmail.push(now);
    rateMapEmail.set(emailKey, recentEmail);
    return false;
  }

  recentEmail.push(now);
  recentIp.push(now);
  rateMapEmail.set(emailKey, recentEmail);
  rateMapIp.set(ipKey, recentIp);
  return true;
}

function toBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

/**
 * Server action bound to MagicLinkForm. Never reveals whether the email is
 * in the allowlist — the UI always redirects to ?sent=1 on a valid-looking
 * email, and the response time is equalized regardless of allowlist state.
 *
 * Errors returned from this action are **form-shape** errors (invalid
 * email, rate limit, transient Supabase failure). Allowlist misses are NOT
 * errors — they return { ok: true } silently and the user hits the
 * confirmation page.
 */
export async function requestMagicLink(
  _prev: MagicLinkState | undefined,
  formData: FormData
): Promise<MagicLinkState> {
  const rawEmail = formData.get("email");
  if (typeof rawEmail !== "string") {
    return { ok: false, error: "login_error_invalid" };
  }

  const email = rawEmail.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
    return { ok: false, error: "login_error_invalid" };
  }

  // Build the absolute callback URL from the forwarded request headers —
  // the project does not set NEXT_PUBLIC_SITE_URL so we derive it per
  // request instead. We also extract the client IP here for the per-IP
  // rate-limit bucket.
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!underRateLimit(email, ip)) {
    return { ok: false, error: "login_error_rate_limit" };
  }

  if (!isAllowlisted(email)) {
    // Equalize response time — do NOT call Supabase. Sleep for a jittered
    // window matching the allowlisted branch's floor so an attacker can't
    // side-channel allowlist membership from latency.
    await new Promise((resolve) => setTimeout(resolve, randomEqualizerDelay()));
    redirect(`/admin/login?sent=1&email=${toBase64(email)}`);
  }

  if (!host) {
    console.error("admin_action_failed", {
      code: "missing_host_header",
      action: "requestMagicLink",
    });
    return { ok: false, error: "login_error_generic" };
  }
  const origin = `${proto}://${host}`;
  const emailRedirectTo = `${origin}/auth/callback`;

  const supabase = await createClient();
  // Race the real OTP call against a fixed floor — whichever takes longer
  // wins. This clamps the allowlisted branch to never return faster than
  // the decoy branch's lower bound, neutralizing latency side-channels.
  const [{ error }] = await Promise.all([
    supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    }),
    new Promise((resolve) => setTimeout(resolve, TIMING_EQUALIZER_FLOOR_MS)),
  ]);

  if (error) {
    // Redacted email keeps the recipient traceable without leaking the
    // full address; Supabase error shape is reduced to its safe `code`
    // field (never .message / .details / .hint).
    const rateLimited = isProviderRateLimit(error);
    console.error("admin_action_failed", {
      code: (error as { code?: string }).code ?? (error as { status?: number }).status ?? "unknown",
      action: "requestMagicLink",
      email: redactEmail(email),
      ...(rateLimited ? { rateLimited: true } : {}),
    });
    return {
      ok: false,
      error: rateLimited ? "login_error_provider_rate_limit" : "login_error_generic",
    };
  }

  redirect(`/admin/login?sent=1&email=${toBase64(email)}`);
}
