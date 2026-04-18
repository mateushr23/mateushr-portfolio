import type { CarouselRepo } from "@/components/space/ProjectsCarousel";
import { createClient } from "@/lib/supabase/server";

/**
 * Home carousel data source. Returns every showcase repo from the Supabase
 * `repos` table that is not flagged `is_hidden`, ordered in two tiers:
 * `is_featured` descending first (so admin-featured repos lead the carousel),
 * then `pushed_at` descending within each tier so the most recently updated
 * project wins the tie-break. The sync pipeline already filters to public,
 * owned, non-fork, non-archived repos, so any row that survives the admin
 * hide toggle is a legitimate carousel entry.
 *
 * Consumed by both `src/app/page.tsx` (PT) and `src/app/en/page.tsx` (EN) —
 * the helper is locale-agnostic (ProjectsCarousel picks the description
 * column downstream based on the page's locale).
 */
export async function fetchCarouselRepos(): Promise<CarouselRepo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repos")
    .select("github_id, name, description_pt, description_en, stack, url")
    .eq("is_hidden", false)
    .order("is_featured", { ascending: false })
    .order("pushed_at", { ascending: false });

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

  return data;
}
