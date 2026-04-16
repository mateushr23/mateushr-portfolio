import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Browser-side Supabase client for Client Components.
 *
 * Per @supabase/ssr guidance for the App Router, this is a factory — call it
 * inside each component that needs a client rather than caching a singleton
 * at module scope. The underlying `createBrowserClient` already memoizes the
 * actual client instance, so repeated calls are cheap.
 */
export function createClient(): ReturnType<typeof createBrowserClient<Database>> {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
