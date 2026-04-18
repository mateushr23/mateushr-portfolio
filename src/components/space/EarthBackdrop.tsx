"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { Dictionary } from "@/i18n";

/**
 * Decorative Earth backdrop. A 900x900 cartoon globe with four astronauts
 * at cardinal points; only the NORTH arc (the top cap, plus the astronaut
 * sitting on it) is visible inside the viewport — the rest hangs below
 * the bottom edge, giving the "peeking from below" feel of the space motif.
 *
 * Sizing is driven by global CSS variables so the same math that positions
 * the image also drives the reserved zone at the bottom of `<main>` (see
 * `--earth-visible` in globals.css). This guarantees headline / name / CTAs
 * never overlap the earth arc at any viewport size:
 * - `--earth-size` clamps with viewport width (and shrinks on short viewports)
 * - `--earth-hidden-ratio` is the fraction of the square that sits below the
 *   viewport bottom. Visible cap = size * (1 - hidden-ratio) = `--earth-visible`.
 * - `<main>` reserves `--earth-visible + --home-anchors-strip + --earth-safe-gap`
 *   as padding-bottom.
 *
 * Positioned `fixed` so it stays glued to the viewport bottom regardless of
 * page scroll. On landscape phones (`max-height: 500px`) `--earth-visible`
 * collapses to 0 and the globe is hidden entirely (globals.css media query).
 *
 * Rotation: driven by the root CSS custom property `--earth-rotation`, which
 * SceneController sets on `<html>` when the scene advances. The inner
 * rotation wrapper uses `transform-origin: center 70%` so the pivot lands
 * roughly on the earth's equator (only the top ~32% of the globe is visible —
 * the true globe center sits below the viewport, so rotating around 70% of
 * the square's height keeps the visible cap spinning in place instead of
 * swinging off-screen).
 *
 * Scene-aware fade: this is now a Client Component that listens to the
 * `scene:change` CustomEvent emitted by SceneController. On scene 4
 * (ContactForm) the globe fades out (opacity 0 + pointer-events: none)
 * with a 700ms transition that matches the scene-wrapper transition. On
 * every other scene it stays fully opaque.
 *
 * Wrapper is `aria-hidden` because the meaning is already conveyed by the
 * headline + NameBanner; the alt text on the inner <Image> stays descriptive
 * as a hedge for image-only crawlers / social previews.
 */
interface EarthBackdropProps {
  dict: Dictionary["earth"];
}

export function EarthBackdrop({ dict }: EarthBackdropProps) {
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

  const isContactScene = scene === 4;

  return (
    <div
      aria-hidden="true"
      className="earth-backdrop pointer-events-none fixed left-1/2 z-10 hidden aspect-square -translate-x-1/2 md:block"
      style={{
        width: "var(--earth-size)",
        height: "var(--earth-size)",
        bottom: "calc(var(--earth-hidden-ratio) * -1 * var(--earth-size))",
        opacity: isContactScene ? 0 : 1,
        pointerEvents: isContactScene ? "none" : undefined,
        transition: "opacity 700ms ease-out",
      }}
    >
      <div
        className="h-full w-full"
        style={{
          transform: "rotate(var(--earth-rotation, 0deg))",
          transformOrigin: "center center",
          transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
        }}
      >
        <Image
          src="/assets/space/earth-astronauts.png"
          alt={dict.alt}
          width={900}
          height={900}
          priority
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}
