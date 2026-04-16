import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase auth session cookies on every matched request.
 *
 * Follows the official @supabase/ssr pattern: forward incoming cookies,
 * intercept the Set-Cookie writes from the refreshed session, and mirror
 * them back on the outgoing response.
 *
 * Do NOT call getSession() here — it does not validate the JWT. getUser()
 * round-trips to Supabase Auth, which is what triggers the refresh.
 *
 * Stage 4 will add `/admin` gating on top of this. For now we never
 * redirect.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Triggers the session refresh. Result is intentionally unused — the
  // side effect (cookie rotation) is the point.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
