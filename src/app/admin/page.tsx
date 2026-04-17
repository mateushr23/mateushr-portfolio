import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminRepoList } from "@/components/admin/AdminRepoList";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { Starfield } from "@/components/space/Starfield";
import { isAllowlisted, redactEmail } from "@/lib/admin/allowlist";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import { AdminListSkeleton } from "./AdminListSkeleton";
import { refreshRepos } from "./actions";

type Repo = Database["public"]["Tables"]["repos"]["Row"];

export const metadata: Metadata = {
  title: "Admin · repos",
  robots: { index: false, follow: false },
};

/**
 * Fetch ALL repos via the service-role admin client — this view needs
 * is_hidden=true rows too, which the cookie-scoped anon client hides via
 * RLS. Never log the full data set.
 */
async function fetchAllRepos(): Promise<Repo[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("repos")
    .select(
      "id, github_id, name, description_ai, stack, language, stars, url, pushed_at, is_featured, is_hidden, created_at, updated_at, source_hash"
    )
    .order("pushed_at", { ascending: false });

  if (error) {
    // Redacted — never emit error.message / .details / .hint (Supabase can
    // echo table/column/policy names in those fields).
    const code =
      (error as { code?: string }).code ??
      String((error as { status?: number }).status ?? "unknown");
    console.error("admin_action_failed", { code, action: "fetchAllRepos" });
    return [];
  }

  return data ?? [];
}

async function RepoListSection() {
  const repos = await fetchAllRepos();
  return <AdminRepoList repos={repos} />;
}

export default async function AdminPage() {
  // Layer 2 of the defense — middleware already blocks unauthenticated
  // requests; this rechecks the session and re-verifies the allowlist so a
  // bypass or stale session can't reach the data.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (!isAllowlisted(user.email)) {
    console.warn(`[admin/page] non-allowlisted session ${redactEmail(user.email)}`);
    await supabase.auth.signOut();
    redirect("/admin/login?error=denied");
  }

  return (
    <>
      <a href="#admin-main" className="skip-link">
        Pular para conteúdo
      </a>
      <Starfield />
      <AdminHeader email={user.email ?? undefined} />
      <main id="admin-main" className="relative z-10">
        <section
          aria-labelledby="admin-list-heading"
          className="mx-auto max-w-container px-5 py-16 md:px-12 md:py-20"
        >
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="flex flex-col gap-3">
              <p
                id="admin-list-heading"
                className="mono text-message uppercase tracking-widest text-(--color-accent) opacity-70"
              >
                REPOS
              </p>
              <h1 className="font-display text-hero font-bold uppercase leading-none tracking-[0.025em] text-(--color-accent)">
                curadoria
              </h1>
            </div>
            <RefreshButton action={refreshRepos} />
          </div>

          <Suspense fallback={<AdminListSkeleton />}>
            <RepoListSection />
          </Suspense>
        </section>
      </main>
    </>
  );
}
