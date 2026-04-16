import { Hero } from "@/components/Hero";
import { PaperGrain } from "@/components/PaperGrain";
import { ProjectIndex } from "@/components/ProjectIndex";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Repo = Database["public"]["Tables"]["repos"]["Row"];

/**
 * Home page (RSC). Fetches visible repos server-side via the Supabase
 * server client — which runs under the user's cookie-scoped anon key so
 * RLS policies are enforced. Non-throwing: on fetch error we log once
 * (server-side) and render the empty-state fallback. The page always
 * renders.
 */
async function fetchVisibleRepos(): Promise<Repo[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("repos")
    .select(
      "id, github_id, name, description_ai, language, stars, url, pushed_at, is_featured, is_hidden, created_at, updated_at, source_hash"
    )
    .eq("is_hidden", false)
    .order("is_featured", { ascending: false })
    .order("pushed_at", { ascending: false });

  if (error) {
    // Single server-side log; never throw — the page must render.
    console.error("[home] failed to fetch repos", error.message);
    return [];
  }

  return data ?? [];
}

export default async function Home() {
  const repos = await fetchVisibleRepos();

  return (
    <>
      <a href="#projetos" className="skip-link">
        Pular para projetos
      </a>
      <PaperGrain />
      <SiteHeader />
      <main className="relative z-10">
        <Hero />
        <ProjectIndex repos={repos} />
      </main>
      <SiteFooter />
    </>
  );
}
