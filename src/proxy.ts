import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase auth session cookies on every matched request and
 * gates the /admin* tree.
 *
 * Follows the official @supabase/ssr pattern: forward incoming cookies,
 * intercept the Set-Cookie writes from the refreshed session, and mirror
 * them back on the outgoing response.
 *
 * Do NOT call getSession() here — it does not validate the JWT. getUser()
 * round-trips to Supabase Auth, which is what triggers the refresh.
 *
 * /admin gating (defense-in-depth with per-page guards):
 *   - Unauthenticated requests to /admin or /admin/* (except /admin/login)
 *     redirect to /admin/login.
 *   - Authenticated requests to /admin/login redirect to /admin.
 *   - Every /admin* response carries X-Robots-Tag: noindex, nofollow.
 *
 * Allowlist membership is NOT checked here — that belongs to the server
 * actions / page guards which have access to server-only modules. The
 * middleware's only job is the auth gate.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Triggers the session refresh. Result is intentionally used below for
  // the /admin* gate; the side effect (cookie rotation) still happens.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginRoute = pathname === "/admin/login";
  // Auth callback is never treated as "admin" for the gate — it handles its
  // own auth flow. Logout is a Server Action now (no distinct URL), so no
  // special-case is required here.
  const isAuthCallback = pathname === "/auth/callback";

  if (isAdminRoute && !isAuthCallback) {
    if (!user && !isLoginRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.search = "";
      return applyAdminHeaders(NextResponse.redirect(loginUrl));
    }
    if (user && isLoginRoute) {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = "/admin";
      adminUrl.search = "";
      return applyAdminHeaders(NextResponse.redirect(adminUrl));
    }
    return applyAdminHeaders(response);
  }

  return response;
}

function applyAdminHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
