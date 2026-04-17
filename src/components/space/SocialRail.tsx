"use client";

import { GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";

/**
 * Left rail with GitHub + LinkedIn. Default layout is a vertical stack
 * anchored at mid-left; when `ProjectsScene` toggles the carousel view it
 * dispatches a `projects:view` CustomEvent with `{ active: true }` and the
 * rail morphs into a HORIZONTAL row anchored at the bottom (same rhythm
 * line as the SCROLL glyph on the right).
 *
 * Animation — exit-left / enter-bottom phase machine:
 * The user-facing behaviour is "icons FLY OFF the left edge of the viewport,
 * then REAPPEAR rising from below into the new slot". Implemented with a
 * three-state machine:
 *   - `idle`  — no animation, icons sit at their rest position.
 *   - `exit`  — icons slide left off-screen + fade out (`sr-exit-left`).
 *   - `enter` — icons rise up from below + fade in (`sr-enter-bottom`).
 *
 * Two pieces of state drive it:
 *   - `projectsView` — mirrors the CustomEvent payload directly (immediate).
 *     Used only to kick off the phase machine when it diverges from
 *     `displayView`.
 *   - `displayView` — LAGS behind `projectsView`; only flips at the exit→enter
 *     boundary (after the exit animation completes). Drives BOTH each icon's
 *     REST transform (`restTransform(i, displayView)`) AND the `<nav>`'s anchor
 *     (top ↔ bottom). Because the flip happens while icons are offscreen at
 *     opacity 0 (thanks to `animation-fill-mode: forwards`), the nav's anchor
 *     can SNAP instantly — no CSS transition on the nav itself, so the exit
 *     animation stays anchored to the original position and the enter
 *     animation plays from the new anchor. There's no visible midair slide.
 *
 * DOM layering — nested transforms compose. The OUTER per-icon wrapper owns
 * the rest-position transform (no CSS transition, snaps instantly when
 * `displayView` flips). The INNER wrapper runs the keyframe animation, whose
 * `translate(-120vw, 0)` on exit is layered inside the rest coordinate space
 * — guaranteeing the icon actually leaves the viewport regardless of where
 * its rest slot is. `forwards` fill keeps the final frame displayed so the
 * gap between exit-end and enter-start stays invisible (both at opacity 0).
 *
 * Timer choreography — an outer `setTimeout(700)` matches the exit animation
 * length; at its fire it flips `displayView`, sets phase to `enter`, and
 * schedules an inner `setTimeout(700)` that returns the phase to `idle`. A
 * `useRef` tracks the inner timer so a cleanup triggered by component unmount
 * OR a rapid re-toggle mid-animation can clear both timers (no stale setState
 * on an unmounted component, no overlapping animation state).
 *
 * Active bottom anchor mirrors the SCROLL glyph's bottom rhythm line:
 *   `calc(var(--earth-visible) * 0.12 + 1.5rem)`
 *
 * Size — 3.25rem × 3.25rem (≈52px, the WCAG 2.5.8 tap-target minimum); slot
 * offset of 5rem (icon + ~28px gap) clears the recommended ~24px separation
 * between neighbouring tap targets.
 *
 * Reduced motion — `.sr-phase-exit` / `.sr-phase-enter` animations are
 * disabled under `prefers-reduced-motion: reduce` (see `globals.css`), so the
 * displayView flip becomes an instant layout change for those users.
 */
const SOCIAL_LINKS = [
  {
    key: "github",
    href: "https://github.com/mateushr23",
    label: "GitHub (abre em nova aba)",
    Icon: GitHubLogoIcon,
  },
  {
    key: "linkedin",
    href: "https://linkedin.com/in/mateushr",
    label: "LinkedIn (abre em nova aba)",
    Icon: LinkedInLogoIcon,
  },
] as const;

type Phase = "idle" | "exit" | "enter";

/** Rest transform per icon index + current displayView. Icon 0 is the
 * anchor; icon 1 sits 5rem right (horizontal/active) or 5rem down (vertical). */
function restTransform(i: number, displayView: boolean): string {
  if (i === 0) return "translate(0, 0)";
  if (i === 1) return displayView ? "translate(5rem, 0)" : "translate(0, 5rem)";
  return "translate(0, 0)";
}

export function SocialRail() {
  const [projectsView, setProjectsView] = useState(false);
  const [displayView, setDisplayView] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [sceneIsContact, setSceneIsContact] = useState(false);
  const innerTimerRef = useRef<number | null>(null);

  // Subscribe to the layout-toggle signal from ProjectsScene.
  useEffect(() => {
    const onProjectsView = (e: Event) => {
      const detail = (e as CustomEvent<{ active: boolean }>).detail;
      if (detail && typeof detail.active === "boolean") {
        setProjectsView(detail.active);
      }
    };
    window.addEventListener("projects:view", onProjectsView as EventListener);
    return () => {
      window.removeEventListener("projects:view", onProjectsView as EventListener);
    };
  }, []);

  // Also track scene so the rail can hide itself on the ContactForm scene
  // (scene 4). Opacity + pointer-events toggle layered on top of the
  // existing phase machine — they don't interfere because we apply the
  // opacity override to the nav wrapper, while the phase machine mutates
  // inner transform/opacity per icon via CSS keyframes.
  useEffect(() => {
    const onSceneChange = (e: Event) => {
      const detail = (e as CustomEvent<{ scene: number }>).detail;
      if (detail && typeof detail.scene === "number") {
        setSceneIsContact(detail.scene === 4);
      }
    };
    window.addEventListener("scene:change", onSceneChange as EventListener);
    return () => {
      window.removeEventListener("scene:change", onSceneChange as EventListener);
    };
  }, []);

  // Phase choreography — when projectsView diverges from displayView, run the
  // exit→(flip)→enter sequence. Refs guard the inner timer so cleanups on
  // unmount or rapid re-toggle don't leak or double-fire. We intentionally
  // kick the `exit` phase from inside the effect: we're syncing React state
  // with an imperative animation timeline owned by the browser (the CSS
  // keyframe engine). Deriving phase during render would require additional
  // divergence-tracking state that triggers the same cascade — the effect +
  // eslint-disable is the simpler, honest expression of "an external async
  // system must observe this state change".
  useEffect(() => {
    if (projectsView === displayView) return;
    // Syncing React state with the CSS keyframe animation timeline (external system); see comment above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("exit");
    const exitTimer = window.setTimeout(() => {
      setDisplayView(projectsView);
      setPhase("enter");
      innerTimerRef.current = window.setTimeout(() => {
        setPhase("idle");
        innerTimerRef.current = null;
      }, 700);
    }, 700);
    return () => {
      clearTimeout(exitTimer);
      if (innerTimerRef.current !== null) {
        clearTimeout(innerTimerRef.current);
        innerTimerRef.current = null;
      }
    };
  }, [projectsView, displayView]);

  const className = "absolute left-4 md:left-12 z-30";

  const navAnchorStyle: React.CSSProperties = displayView
    ? {
        top: "auto",
        bottom: "calc(var(--earth-visible) * 0.12 + 1.5rem)",
      }
    : {
        top: "34%",
        bottom: "auto",
      };

  const navStyle: React.CSSProperties = {
    width: "3.25rem",
    height: "3.25rem",
    ...navAnchorStyle,
    opacity: sceneIsContact ? 0 : 1,
    pointerEvents: sceneIsContact ? "none" : undefined,
    transition: "opacity 700ms ease-out",
  };

  const phaseClass = phase === "exit" ? "sr-phase-exit" : phase === "enter" ? "sr-phase-enter" : "";

  return (
    <nav aria-label="Links sociais" className={className} style={navStyle}>
      {SOCIAL_LINKS.map(({ key, href, label, Icon }, i) => (
        <div
          key={key}
          className="absolute inset-0"
          style={{ transform: restTransform(i, displayView) }}
        >
          <div className={phaseClass} style={{ width: "100%", height: "100%" }}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="inline-flex h-full w-full items-center justify-center text-(--color-accent) transition-colors hover:text-accent-bright"
            >
              <Icon className="h-10 w-10" />
            </a>
          </div>
        </div>
      ))}
    </nav>
  );
}
