"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Server Action — signs the current user out and redirects to /admin/login.
 *
 * Implemented as a Server Action (not a Route Handler) so Next.js's built-in
 * Server Action CSRF protection (Origin/Host header check) applies. A
 * cross-origin POST cannot force-logout the admin.
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  try {
    await supabase.auth.signOut();
  } catch (err) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? ((err as { code?: string }).code ?? "unknown")
        : "unknown";
    console.error("admin_action_failed", { code, action: "logout" });
  }
  redirect("/admin/login");
}
