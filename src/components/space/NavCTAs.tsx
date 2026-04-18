"use client";

import Image from "next/image";
import { useEffect, useState, type MouseEvent } from "react";

import type { Dictionary } from "@/i18n";

/**
 * Single centered "CLICK to open" entry CTA. The SVG glyph is a self-contained
 * composition (text + corner brackets + purple drop-shadow), so the anchor
 * wraps the image directly — no separate brackets or inline text.
 *
 * Positioning: rendered as a viewport-fixed element that floats ON TOP of the
 * earth's visible arc (rather than inside `<main>`'s flex column). Bottom is
 * set to ~55% of `--earth-visible` so the CTA's lower edge sits roughly
 * halfway up the globe's peeking cap, matching the reference composition.
 * `z-30` puts it above EarthBackdrop (z-10) and the top-level UI rail
 * (ContactLink / SocialRail / HomeAnchors, all z-20), so the interactive
 * entry point stays visually dominant.
 *
 * Hover/focus applies a subtle scale. Focus-visible inherits the global outline.
 *
 * Click handler: dispatches a `scene:advance` CustomEvent on `window` instead
 * of navigating the `#` href. `SceneController` listens for this event (and
 * for the ENTER key) to advance the locked-scroll scene state machine —
 * coupling is loose so NavCTAs doesn't need to know scene internals.
 */
interface NavCTAsProps {
  dict: Dictionary["nav"];
}

export function NavCTAs({ dict }: NavCTAsProps) {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const onSceneChange = (e: Event) => {
      const detail = (e as CustomEvent<{ scene: number }>).detail;
      if (detail && typeof detail.scene === "number") {
        setScene(detail.scene);
      }
    };
    window.addEventListener("scene:change", onSceneChange as EventListener);
    return () => {
      window.removeEventListener("scene:change", onSceneChange as EventListener);
    };
  }, []);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("scene:advance"));
  };

  if (scene !== 0) {
    return null;
  }

  return (
    <nav
      aria-label={dict.entryNavLabel}
      className="reveal fixed bottom-[calc(var(--earth-visible)*0.12)] left-1/2 z-30 flex -translate-x-1/2 items-center justify-center"
      style={{ ["--reveal-i" as string]: 2 }}
    >
      {/* TODO(QA): link to real destination (was 3 CTAs, now 1 — pending user direction on target) */}
      <a
        href="#"
        aria-label={dict.entryLinkLabel}
        onClick={handleClick}
        className="inline-flex transition-transform duration-300 hover:scale-[1.02] focus-visible:scale-[1.02]"
      >
        <Image
          src="/assets/space/click-to-open.svg"
          alt="Click to open"
          width={259}
          height={179}
          priority
          className="h-auto w-[220px] md:w-[259px]"
        />
      </a>
    </nav>
  );
}
