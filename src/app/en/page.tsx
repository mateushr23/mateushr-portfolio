import type { Metadata } from "next";

import { BackLink } from "@/components/space/BackLink";
import { ContactLink } from "@/components/space/ContactLink";
import { EarthBackdrop } from "@/components/space/EarthBackdrop";
import { HomeAnchors } from "@/components/space/HomeAnchors";
import { LocaleToggle } from "@/components/space/LocaleToggle";
import { LockScroll } from "@/components/space/LockScroll";
import { NavCTAs } from "@/components/space/NavCTAs";
import { SceneController } from "@/components/space/SceneController";
import { SocialRail } from "@/components/space/SocialRail";
import { SocialRailMobile } from "@/components/space/SocialRailMobile";
import { ShootingStars } from "@/components/space/ShootingStars";
import { Starfield } from "@/components/space/Starfield";
import { getDictionary } from "@/i18n";
import { fetchCarouselRepos } from "@/lib/home/carousel-repos";

/**
 * Home (RSC), English locale, served at `/en`. Near-mirror of
 * `src/app/page.tsx` — every string comes from `getDictionary("en")` and
 * the carousel prefers `description_en` with a PT fallback, all handled
 * inside `ProjectsCarousel` when `locale="en"` is passed.
 *
 * Structural parity with the PT page is intentional: hreflang alternates
 * only stay honest if the two pages render the same chrome at the same
 * depth. When adding new UI (e.g. a future /projects page) keep the two
 * trees in lock-step. The repo list + select columns live in
 * `@/lib/home/carousel-repos` so both routes stay aligned.
 */

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
      // `images` is intentionally omitted here — Next 16 auto-wires the
      // `opengraph-image.tsx` file convention in this segment into the OG
      // metadata (URL, dimensions, alt). See src/app/en/opengraph-image.tsx.
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      // Same — `twitter.images` is auto-filled from opengraph-image.tsx.
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
      <ShootingStars />
      <EarthBackdrop dict={dict.earth} />

      <LocaleToggle locale={locale} dict={dict.toggle} />
      <ContactLink label={dict.contact.corner} />
      <BackLink label={dict.contact.back} />
      <SocialRail dict={dict.nav} />
      <SocialRailMobile dict={dict.nav} contactLabel={dict.contact.corner} />

      <main id="main" className="relative z-20 min-h-dvh">
        <SceneController carouselRepos={carouselRepos} locale={locale} dict={dict} />
      </main>

      <NavCTAs dict={dict.nav} />
      <HomeAnchors />
    </>
  );
}
