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
 * Home (RSC), Portuguese (default locale, served at `/`). Fetches the 3
 * showcase repos via the shared `fetchCarouselRepos` helper so PT and EN
 * stay in lock-step on display order + select columns.
 *
 * Every string rendered on the page flows from `getDictionary("pt")`. The
 * English sibling `/en/page.tsx` is a near-mirror of this file — keep
 * the two in lock-step when adding new UI chrome so hreflang alternates
 * stay symmetric.
 *
 * See handoff open_question_for_user #1 for the /projects follow-up.
 */

export function generateMetadata(): Metadata {
  const dict = getDictionary("pt");
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: "/",
      languages: {
        "pt-BR": "/",
        en: "/en",
        "x-default": "/",
      },
    },
    openGraph: {
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      url: "/",
      siteName: "Mateus Henrique",
      locale: dict.meta.ogLocale,
      type: "website",
      // `images` is intentionally omitted here — Next 16 auto-wires the
      // `opengraph-image.tsx` file convention in this segment into the OG
      // metadata (URL, dimensions, alt). See src/app/opengraph-image.tsx.
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      // Same — `twitter.images` is auto-filled from opengraph-image.tsx.
    },
  };
}

export default async function Home() {
  const locale = "pt" as const;
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

      {/*
        Layout constraints (max-width, horizontal padding, pt for header
        clearance, and the earth-safe padding-bottom) live inside each scene
        wrapper in SceneController. Applying them here would double-offset
        the absolutely-positioned scenes.
      */}
      <main id="main" className="relative z-20 min-h-dvh">
        <SceneController carouselRepos={carouselRepos} locale={locale} dict={dict} />
      </main>

      <NavCTAs dict={dict.nav} />
      <HomeAnchors />
    </>
  );
}
