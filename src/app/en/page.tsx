import type { Metadata } from "next";

import { BackLink } from "@/components/space/BackLink";
import { ContactLink } from "@/components/space/ContactLink";
import { EarthBackdrop } from "@/components/space/EarthBackdrop";
import { HomeAnchors } from "@/components/space/HomeAnchors";
import { LocaleToggle } from "@/components/space/LocaleToggle";
import { LockScroll } from "@/components/space/LockScroll";
import { NavCTAs } from "@/components/space/NavCTAs";
import type { CarouselRepo } from "@/components/space/ProjectsCarousel";
import { SceneController } from "@/components/space/SceneController";
import { SocialRail } from "@/components/space/SocialRail";
import { Starfield } from "@/components/space/Starfield";
import { getDictionary } from "@/i18n";
import { createClient } from "@/lib/supabase/server";

/**
 * Home (RSC), English locale, served at `/en`. Near-mirror of
 * `src/app/page.tsx` — every string comes from `getDictionary("en")` and
 * the carousel prefers `description_en` with a PT fallback, all handled
 * inside `ProjectsCarousel` when `locale="en"` is passed.
 *
 * Structural parity with the PT page is intentional: hreflang alternates
 * only stay honest if the two pages render the same chrome at the same
 * depth. When adding new UI (e.g. a future /projects page) keep the two
 * trees in lock-step.
 */
const CAROUSEL_REPO_ORDER = ["proposal-ai", "task-agent", "doctalk"] as const;

async function fetchCarouselRepos(): Promise<CarouselRepo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repos")
    .select("github_id, name, description_pt, description_en, stack, url")
    .in("name", CAROUSEL_REPO_ORDER as unknown as string[]);

  if (error) {
    // Swallow the error body — see src/app/page.tsx for rationale.
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

export function generateMetadata(): Metadata {
  const dict = getDictionary("en");
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: "/en",
      languages: {
        "pt-BR": "/",
        en: "/en",
        "x-default": "/",
      },
    },
    openGraph: {
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      url: "/en",
      siteName: "Mateus Henrique",
      locale: dict.meta.ogLocale,
      type: "website",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: dict.meta.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      images: ["/og.png"],
    },
  };
}

export default async function HomeEn() {
  const locale = "en" as const;
  const dict = getDictionary(locale);
  const carouselRepos = await fetchCarouselRepos();

  return (
    <>
      <LockScroll />
      <a href="#main" className="skip-link">
        {dict.hero.skipToContent}
      </a>
      <Starfield />
      <EarthBackdrop dict={dict.earth} />

      <LocaleToggle locale={locale} dict={dict.toggle} />
      <ContactLink dict={dict.contact} />
      <BackLink dict={dict.contact} />
      <SocialRail dict={dict.nav} />

      <main id="main" className="relative z-20 min-h-dvh">
        <SceneController carouselRepos={carouselRepos} locale={locale} dict={dict} />
      </main>

      <NavCTAs dict={dict.nav} />
      <HomeAnchors />
    </>
  );
}
