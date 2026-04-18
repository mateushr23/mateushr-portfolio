"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Bottom-right PressAnchor. Scene-aware:
 *   scene 0           → Frame 14 "PRESS" glyph (entry cue for the CLICK CTA).
 *   scene 1..3        → Frame 13 "SCROLL" glyph (scroll/arrow indicator,
 *                        matches the gesture now driving scene transitions).
 *   scene 4           → hidden (the ContactForm scene doesn't have a scroll
 *                        gesture mapping — no glyph shown).
 *
 * Decorative only — no real navigation target. Listens to the `scene:change`
 * CustomEvent dispatched by `SceneController` so the controller remains the
 * single source of scene truth (no shared store / context).
 *
 * Animation — exit/enter phase machine:
 * Swapping the glyph src instantly looked abrupt, so the transition is driven
 * by a three-state machine mirroring the `SocialRail` pattern:
 *   - `idle`  — no animation, current glyph sits at rest.
 *   - `exit`  — current glyph floats up + fades out (`.anchor-glyph-exit`,
 *                300ms ease-in, see `globals.css`).
 *   - `enter` — new glyph rises from below + fades in (`.anchor-glyph-enter`,
 *                400ms ease-out, see `globals.css`).
 *
 * Two pieces of state drive it:
 *   - `targetIcon` — derived from the raw `scene` (press when scene 0, scroll
 *     when scene ≥ 1). Source of truth for what SHOULD be rendered.
 *   - `displayIcon` — LAGS behind `targetIcon`; only flips at the exit→enter
 *     boundary (after the 300ms exit animation completes). The `<Image>`
 *     reads from `displayIcon`, so the element keeps the OLD glyph visible
 *     throughout the exit phase and doesn't snap prematurely.
 *
 * Timer choreography — an outer `setTimeout(300)` matches the exit animation;
 * at its fire it flips `displayIcon`, sets phase to `enter`, and schedules an
 * inner `setTimeout(400)` that returns the phase to `idle`. `innerTimerRef`
 * holds the inner timer so cleanup on unmount OR a rapid scene re-toggle
 * mid-animation can clear both timers (no stale setState, no overlap).
 *
 * Reduced motion — `.anchor-glyph-exit` / `.anchor-glyph-enter` animations are
 * disabled under `prefers-reduced-motion: reduce` (see `globals.css`); the
 * displayIcon flip still happens but the glyph simply swaps in place.
 */

type IconKind = "press" | "scroll";
type Phase = "idle" | "exit" | "enter";

type PressAnchorProps = { displayIcon: IconKind; phase: Phase };

function PressAnchor({ displayIcon, phase }: PressAnchorProps) {
  const isScrollState = displayIcon === "scroll";
  const src = isScrollState ? "/assets/space/scroll-glyph.svg" : "/assets/space/press-glyph.svg";
  // Frame 14 (press) is 78x125, Frame 13 (scroll) is 90x126. Render them at
  // similar visible widths so the slot reads the same across scenes.
  const width = isScrollState ? 90 : 78;
  const height = isScrollState ? 126 : 125;
  const sizeClass = isScrollState ? "h-auto w-[70px] md:w-[90px]" : "h-auto w-[60px] md:w-[78px]";

  const phaseClass =
    phase === "exit" ? "anchor-glyph-exit" : phase === "enter" ? "anchor-glyph-enter" : "";

  return (
    <div className="flex flex-col items-end">
      <span className={`inline-block ${phaseClass}`}>
        <Image
          src={src}
          alt=""
          width={width}
          height={height}
          aria-hidden="true"
          className={sizeClass}
        />
      </span>
    </div>
  );
}

export function HomeAnchors() {
  const [scene, setScene] = useState(0);
  const [displayIcon, setDisplayIcon] = useState<IconKind>("press");
  const [phase, setPhase] = useState<Phase>("idle");
  const innerTimerRef = useRef<number | null>(null);

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

  const targetIcon: IconKind = scene >= 1 ? "scroll" : "press";

  // Phase choreography — when targetIcon diverges from displayIcon, run the
  // exit→(flip)→enter sequence. Refs guard the inner timer so cleanups on
  // unmount or a rapid scene re-toggle don't leak or double-fire. We
  // intentionally kick the `exit` phase from inside the effect: we're
  // syncing React state with an imperative animation timeline owned by the
  // browser (the CSS keyframe engine) — same rationale as SocialRail.
  useEffect(() => {
    if (targetIcon === displayIcon) return;
    // Syncing React state with the CSS keyframe animation timeline (external system); see comment above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("exit");
    const exitTimer = window.setTimeout(() => {
      setDisplayIcon(targetIcon);
      setPhase("enter");
      innerTimerRef.current = window.setTimeout(() => {
        setPhase("idle");
        innerTimerRef.current = null;
      }, 400);
    }, 300);
    return () => {
      clearTimeout(exitTimer);
      if (innerTimerRef.current !== null) {
        clearTimeout(innerTimerRef.current);
        innerTimerRef.current = null;
      }
    };
  }, [targetIcon, displayIcon]);

  // Scene 4 (ContactForm) doesn't have a scroll-gesture mapping — the user
  // got there via an explicit link click, and wheel-down is a no-op at
  // that point. Suppress the anchor entirely so it doesn't mislead.
  if (scene === 4) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed left-6 right-6 z-20 hidden items-end justify-end md:flex md:left-12 md:right-12"
      style={{
        // PRESS sits on the RIGHT edge, aligned vertically with the
        // CLICK-to-open CTA (anchored at var(--earth-visible)*0.12).
        // Small +1.5rem offset centers PRESS visually against the taller
        // CTA glyph since PRESS is shorter (125px vs 179px).
        bottom: "calc(var(--earth-visible) * 0.12 + 1.5rem)",
      }}
      aria-hidden="false"
    >
      <PressAnchor displayIcon={displayIcon} phase={phase} />
    </div>
  );
}
