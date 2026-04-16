import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

/**
 * Server-side Supabase client for Server Components, Server Actions, and
 * Route Handlers. Uses the publishable key scoped by the user's auth cookie, so
 * RLS policies are enforced.
 *
 * Next.js 15+ (including 16) exposes `cookies()` as an async API, hence the
 * `await`. The `setAll` call is wrapped in try/catch because Server
 * Components cannot mutate cookies during render — in that case we silently
 * drop the write; the middleware refreshes cookies on the next navigation.
 */
export async function createClient(): Promise<ReturnType<typeof createServerClient<Database>>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // RSC cannot set cookies — middleware refreshes them instead.
          }
        },
      },
    }
  );
}
