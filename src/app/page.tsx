import { BackLink } from "@/components/space/BackLink";
import { ContactLink } from "@/components/space/ContactLink";
import { EarthBackdrop } from "@/components/space/EarthBackdrop";
import { HomeAnchors } from "@/components/space/HomeAnchors";
import { LockScroll } from "@/components/space/LockScroll";
import { NavCTAs } from "@/components/space/NavCTAs";
import { SceneController } from "@/components/space/SceneController";
import type { CarouselRepo } from "@/components/space/ProjectsCarousel";
import { SocialRail } from "@/components/space/SocialRail";
import { Starfield } from "@/components/space/Starfield";
import { createClient } from "@/lib/supabase/server";

/**
 * Home (RSC). Fetches the 3 showcase repos (proposal-ai, task-agent, doctalk)
 * from Supabase so the carousel renders live `stack` + `description_ai` from
 * the README-driven sync. The display order is fixed here (not taken from
 * the DB) because the carousel tells a deliberate narrative sequence.
 *
 * See handoff open_question_for_user #1 for the /projects follow-up.
 */
const CAROUSEL_REPO_ORDER = ["proposal-ai", "task-agent", "doctalk"] as const;

async function fetchCarouselRepos(): Promise<CarouselRepo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repos")
    .select("github_id, name, description_ai, stack, url")
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

export default async function Home() {
  const carouselRepos = await fetchCarouselRepos();

  return (
    <>
      <LockScroll />
      <a href="#main" className="skip-link">
        Pular para conteúdo principal
      </a>
      <Starfield />
      <EarthBackdrop />

      <ContactLink />
      <BackLink />
      <SocialRail />

      {/*
        Layout constraints (max-width, horizontal padding, pt for header
        clearance, and the earth-safe padding-bottom) live inside each scene
        wrapper in SceneController. Applying them here would double-offset
        the absolutely-positioned scenes.
      */}
      <main id="main" className="relative z-20 min-h-dvh">
        <SceneController carouselRepos={carouselRepos} />
      </main>

      <NavCTAs />
      <HomeAnchors />
    </>
  );
}
