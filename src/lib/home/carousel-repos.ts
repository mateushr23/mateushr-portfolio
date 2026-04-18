import type { CarouselRepo } from "@/components/space/ProjectsCarousel";
import { createClient } from "@/lib/supabase/server";

/**
 * Home carousel data source. Fetches the showcase repos from Supabase so the
 * scene-3 carousel renders live `stack` + `description_pt` + `description_en`
 * from the README-driven sync. The display order is fixed here (not taken
 * from the DB) because the carousel tells a deliberate narrative sequence.
 *
 * Consumed by both `src/app/page.tsx` (PT) and `src/app/en/page.tsx` (EN) —
 * the helper is locale-agnostic (ProjectsCarousel picks the description
 * column downstream based on the page's locale).
 */
export const CAROUSEL_REPO_ORDER = ["proposal-ai", "task-agent", "doctalk"] as const;

export async function fetchCarouselRepos(): Promise<CarouselRepo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repos")
    .select("github_id, name, description_pt, description_en, stack, url")
    .in("name", CAROUSEL_REPO_ORDER as unknown as string[]);

  if (error) {
    // Never echo error.message / .details / .hint (Supabase can leak schema
    // names in those). Keep the fallback carousel empty; the downstream
    // component renders a dignified placeholder when the list is empty.
    const code =
      (error as { code?: string }).code ??
      String((error as { status?: number }).status ?? "unknown");
    console.error("home_fetch_failed", { code, action: "fetchCarouselRepos" });
    return [];
  }

  const byName = new Map(data.map((repo) => [repo.name, repo]));
  return CAROUSEL_REPO_ORDER.map((name) => byName.get(name)).filter(
    (repo): repo is CarouselRepo => repo !== undefined
  );
}
