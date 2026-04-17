"use client";

import { useEffect, useRef, useState } from "react";

import { ContactForm } from "./ContactForm";
import { GalaxyHeadline } from "./GalaxyHeadline";
import { NameBanner } from "./NameBanner";
import { PresentationText } from "./PresentationText";
import type { CarouselRepo } from "./ProjectsCarousel";
import { ProjectsScene } from "./ProjectsScene";
import { SkillsGrid } from "./SkillsGrid";

/**
 * Scene state machine for the locked-scroll home. Because `LockScroll`
 * disables page scroll, we can't use real scroll to drive transitions —
 * instead, each "scene" is a discrete state that fades / translates one
 * block out and the next block in, while also updating a root CSS custom
 * property (`--earth-rotation`) that `EarthBackdrop` consumes to spin the
 * globe to the next astronaut.
 *
 * Scenes:
 *   0 — GalaxyHeadline + NameBanner (entry)
 *   1 — PresentationText
 *   2 — SkillsGrid
 *   3 — ProjectsInvite
 *   4 — ContactForm (reached only via Contact Me link — explicit intent;
 *       NOT reachable by wheel/scroll advance from scene 3). Regresses
 *       to scene 3 normally via wheel-up / ArrowUp / PageUp.
 *
 * Advance / regress triggers (capped at the scene bounds):
 * - ENTER key → advance. ArrowDown / PageDown → advance. ArrowUp / PageUp → regress.
 * - `wheel` event: deltaY > threshold → advance (capped at `WHEEL_MAX_SCENE`
 *   so scene 4 stays gated behind the Contact Me link), deltaY < -threshold
 *   → regress. Page scroll stays CSS-locked; we only interpret the gesture.
 * - `scene:advance` CustomEvent on `window` (dispatched by NavCTAs click).
 * - `scene:goto` CustomEvent with `{ scene: number }` (dispatched by
 *   ContactLink click) — jumps directly to any scene, clamped to bounds.
 *
 * A ref-based lock (`transitionLockRef`) throttles transitions to one per
 * `TRANSITION_LOCK_MS` window so a single wheel gesture or key hold can't
 * jump multiple scenes at once. The lock duration matches the earth
 * rotation transition (900ms) so visuals don't overlap messily.
 *
 * On every scene change the controller also dispatches a `scene:change`
 * CustomEvent with `detail: { scene }`. `HomeAnchors` listens for this to
 * swap the bottom-right glyph (PRESS on scene 0 → SCROLL on scenes >=1).
 * `EarthBackdrop` and `SocialRail` listen to hide themselves on scene 4.
 * Coupling to EarthBackdrop remains one-way via CSS variable — no shared
 * store, no context, no prop drilling.
 */

const TOTAL_SCENES = 5;
// Cap for wheel / keyboard advance. Scene 4 (ContactForm) is intentionally
// gated behind the explicit Contact Me link — wheel/scroll from scene 3
// does NOT advance into it. Regression from scene 4 works normally.
const WHEEL_MAX_SCENE = 3;
// Rotate CCW per scene so the astronaut sitting on the EAST cardinal
// point (i.e. visually to the right of the current one at "north") swings
// up to the top of the visible arc.
const EARTH_STEP_DEG = 90;
// Wheel deltaY magnitude that counts as an intentional scroll gesture.
// Trackpad inertial scrolls easily emit 4-8 per frame; a real wheel notch
// is typically 100+. Threshold 30 filters out incidental drift without
// requiring a hard scroll.
const WHEEL_THRESHOLD = 30;
// Ignore window for subsequent gestures after a transition fires.
// Matches the 900ms earth rotation transition in EarthBackdrop so a
// new scene can't start before the previous one settles.
const TRANSITION_LOCK_MS = 900;

interface SceneControllerProps {
  carouselRepos: CarouselRepo[];
}

export function SceneController({ carouselRepos }: SceneControllerProps) {
  const [scene, setScene] = useState(0);
  const transitionLockRef = useRef(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--earth-rotation", `${scene * EARTH_STEP_DEG}deg`);
    window.dispatchEvent(new CustomEvent("scene:change", { detail: { scene } }));
  }, [scene]);

  useEffect(() => {
    const runLocked = (mutator: () => void) => {
      if (transitionLockRef.current) return;
      transitionLockRef.current = true;
      mutator();
      window.setTimeout(() => {
        transitionLockRef.current = false;
      }, TRANSITION_LOCK_MS);
    };

    const advance = () => {
      runLocked(() => {
        setScene((s) => Math.min(WHEEL_MAX_SCENE, s + 1));
      });
    };
    const regress = () => {
      runLocked(() => {
        setScene((s) => Math.max(0, s - 1));
      });
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        regress();
      }
    };
    const onAdvanceEvent = () => {
      advance();
    };
    const onGotoEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ scene: number }>).detail;
      if (detail && typeof detail.scene === "number") {
        runLocked(() => {
          const target = Math.max(0, Math.min(TOTAL_SCENES - 1, detail.scene));
          setScene(target);
        });
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (transitionLockRef.current) return;
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
      if (e.deltaY > 0) advance();
      else regress();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("scene:advance", onAdvanceEvent as EventListener);
    window.addEventListener("scene:goto", onGotoEvent as EventListener);
    // passive: true — we don't preventDefault (scroll is already CSS-locked).
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scene:advance", onAdvanceEvent as EventListener);
      window.removeEventListener("scene:goto", onGotoEvent as EventListener);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Each scene replicates the clamp the original <main> applied (max-width,
  // horizontal padding, pt for header clearance, and padding-bottom reserving
  // the earth-safe zone). Kept inline — the rest of the class list differs per
  // scene (gap on scene 0, none on scene 1+), so extracting a constant would
  // trade one repetition for another.
  const earthSafePaddingBottom =
    "calc(var(--earth-visible) + var(--home-anchors-strip) + var(--earth-safe-gap))";

  return (
    <div className="relative min-h-dvh w-full">
      <div
        className="absolute inset-0 mx-auto flex w-full max-w-container flex-col items-center justify-center gap-12 px-6 pt-24 transition-all duration-700 md:gap-16 md:px-16 md:pt-40"
        style={{
          paddingBottom: earthSafePaddingBottom,
          opacity: scene === 0 ? 1 : 0,
          transform: scene === 0 ? "translateY(0)" : "translateY(-30%)",
          pointerEvents: scene === 0 ? "auto" : "none",
        }}
        aria-hidden={scene !== 0}
      >
        <GalaxyHeadline />
        <NameBanner />
      </div>
      <Scene index={1} currentScene={scene}>
        <PresentationText />
      </Scene>
      <Scene index={2} currentScene={scene}>
        <SkillsGrid />
      </Scene>
      <Scene index={3} currentScene={scene}>
        <ProjectsScene repos={carouselRepos} />
      </Scene>
      {/* Scene 4 — ContactForm. No earth-safe padding: the globe fades out
          on this scene (see EarthBackdrop), so we reclaim that space for
          the form itself. Uses the same slide pattern as scene 3. */}
      <Scene index={4} currentScene={scene} noEarthSafePad>
        <ContactForm />
      </Scene>
    </div>
  );
}

function Scene({
  index,
  currentScene,
  noEarthSafePad,
  children,
}: {
  index: number;
  currentScene: number;
  noEarthSafePad?: boolean;
  children: React.ReactNode;
}) {
  const earthSafePaddingBottom =
    "calc(var(--earth-visible) + var(--home-anchors-strip) + var(--earth-safe-gap))";
  return (
    <div
      className="absolute inset-0 mx-auto flex w-full max-w-container flex-col items-center justify-center px-6 pt-24 transition-all duration-700 md:px-16 md:pt-40"
      style={{
        paddingBottom: noEarthSafePad ? "4rem" : earthSafePaddingBottom,
        opacity: currentScene === index ? 1 : 0,
        transform:
          currentScene === index
            ? "translateY(0)"
            : currentScene < index
              ? "translateY(30%)"
              : "translateY(-30%)",
        pointerEvents: currentScene === index ? "auto" : "none",
      }}
      aria-hidden={currentScene !== index}
    >
      {children}
    </div>
  );
}
