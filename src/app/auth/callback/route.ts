import { NextResponse, type NextRequest } from "next/server";

import { isAllowlisted, redactEmail } from "@/lib/admin/allowlist";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Supabase magic-link callback. Exchanges the short-lived ?code for a
 * session, then verifies the resulting session's email against the
 * server-only allowlist. Non-allowlisted users are signed back out and
 * bounced to /admin/login?error=denied.
 *
 * Even if Supabase Auth would happily create the session for any email
 * that clicked a valid magic link, this guard ensures only allowlisted
 * sessions reach the gated area.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");

  const loginUrl = new URL("/admin/login", origin);
  const deniedUrl = new URL("/admin/login?error=denied", origin);
  const adminUrl = new URL("/admin", origin);

  if (!code) {
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    // Redacted — do not log error.message / .details / .hint (can echo
    // Supabase schema metadata). The `code` field is safe (SQLSTATE /
    // Supabase auth status).
    const code = error
      ? ((error as { code?: string }).code ??
        String((error as { status?: number }).status ?? "unknown"))
      : "no_session";
    console.error("admin_action_failed", {
      code,
      action: "auth_callback_exchange",
    });
    return NextResponse.redirect(loginUrl);
  }

  const email = data.session.user.email ?? null;

  if (!isAllowlisted(email)) {
    console.warn(`[auth/callback] denied non-allowlisted session ${redactEmail(email)}`);
    await supabase.auth.signOut();
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.redirect(adminUrl);
}
