import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Server-only Supabase admin client. Bypasses RLS via the service_role key.
 * Never import from client code — this key has full database access.
 *
 * Intended callers: the daily Claude Code Routine (GitHub -> Supabase sync),
 * future cron jobs, and privileged server-side admin endpoints.
 */
export function createAdminClient(): SupabaseClient<Database> {
  // Runtime guard: throw loudly if this module ever gets evaluated in the
  // browser (e.g. accidental import from a Client Component). This is a
  // backstop — the real defense is to only import this from server files.
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() is server-only. Do not import from client code.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL env var.");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var.");
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
