"use server";

import { revalidatePath } from "next/cache";

import { isAllowlisted, redactEmail } from "@/lib/admin/allowlist";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { syncRepos } from "@/lib/sync/sync";

/**
 * Re-verifies the current session's email against the server-only
 * allowlist. Every admin server action MUST call this as its first line —
 * defense in depth against middleware bypass and in case the session
 * predates an allowlist change.
 *
 * Throws a generic Error on failure so the client sees nothing structural
 * (no distinct error codes for unauthenticated vs not-allowlisted).
 */
async function assertAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? null;

  if (!user || !isAllowlisted(email)) {
    // Security event — log redacted so we know something probed, but
    // never echo back to the client.
    console.warn(`[admin/action] rejected session ${redactEmail(email)}`);
    throw new Error("not_authorized");
  }
}

/**
 * Extracts a safe log code from a Supabase / Postgres error object. The
 * returned value is a string that is safe to emit to application logs —
 * no `.message`, `.details`, `.hint`, or raw error objects, which could
 * leak schema metadata (table/column/policy names, stack traces).
 */
function safeErrorCode(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const e = err as { code?: unknown; status?: unknown };
    if (typeof e.code === "string") return e.code;
    if (typeof e.status === "number") return String(e.status);
  }
  return "unknown";
}

export async function toggleFeatured(repoId: string, next: boolean): Promise<{ ok: boolean }> {
  await assertAdmin();

  const admin = createAdminClient();
  const { error } = await admin.from("repos").update({ is_featured: next }).eq("id", repoId);

  if (error) {
    console.error("admin_action_failed", {
      code: safeErrorCode(error),
      action: "toggleFeatured",
    });
    return { ok: false };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleHidden(repoId: string, next: boolean): Promise<{ ok: boolean }> {
  await assertAdmin();

  const admin = createAdminClient();
  const { error } = await admin.from("repos").update({ is_hidden: next }).eq("id", repoId);

  if (error) {
    console.error("admin_action_failed", {
      code: safeErrorCode(error),
      action: "toggleHidden",
    });
    return { ok: false };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function refreshRepos(): Promise<{
  ok: boolean;
  count?: number;
  error?: string;
}> {
  await assertAdmin();

  try {
    const counters = await syncRepos();
    revalidatePath("/admin");
    revalidatePath("/");
    return {
      ok: true,
      count: counters.inserted + counters.updated + counters.hidden,
    };
  } catch (err) {
    console.error("admin_action_failed", {
      code: safeErrorCode(err),
      action: "refreshRepos",
    });
    return { ok: false, error: "sync_failed" };
  }
}
