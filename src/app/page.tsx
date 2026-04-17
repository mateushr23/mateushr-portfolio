import { BackLink } from "@/components/space/BackLink";
import { ContactLink } from "@/components/space/ContactLink";
import { EarthBackdrop } from "@/components/space/EarthBackdrop";
import { HomeAnchors } from "@/components/space/HomeAnchors";
import { LockScroll } from "@/components/space/LockScroll";
import { NavCTAs } from "@/components/space/NavCTAs";
import { SceneController } from "@/components/space/SceneController";
import { SocialRail } from "@/components/space/SocialRail";
import { Starfield } from "@/components/space/Starfield";

/**
 * Home (RSC). Static composition — no data fetching. Repo sync continues
 * in the background via cron + /admin but is no longer rendered here.
 * See handoff open_question_for_user #1 for the /projects follow-up.
 */
export default function Home() {
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
        <SceneController />
      </main>

      <NavCTAs />
      <HomeAnchors />
    </>
  );
}
