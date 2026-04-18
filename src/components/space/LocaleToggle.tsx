"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Dictionary, Locale } from "@/i18n";

/**
 * Top-left locale toggle — PT | EN. Sits in the same corner region as
 * `BackLink` (which renders on scene 4 only). To avoid overlap, this
 * component unmounts on scene 4 — the contact form is an explicit-intent
 * sub-scene where the user's task is focused on the message they're
 * writing, and a locale flip mid-compose would also blow away their draft
 * state (each route has its own React tree). Hiding the toggle there is
 * both consistent with the site's "calm focus" chrome rule and the safer
 * UX.
 *
 * We `return null` (same unmount pattern as `BackLink`) instead of fading
 * with `opacity: 0 + pointer-events: none + aria-hidden`, because the
 * inner `<Link>` children remained focusable via Tab under that approach
 * — an `aria-hidden` wrapper around focusable descendants is a WCAG APG
 * violation. Unmounting removes the focus targets entirely.
 *
 * Routing rule:
 *  - `/`         → PT-BR (default — no prefix)
 *  - `/en`       → English
 *
 * We never carry query strings across the switch (the home page has no
 * meaningful ones right now, and preserving them across a locale flip can
 * leak stale state). The `aria-current="page"` attribute on the active side
 * is the canonical WAI-ARIA 1.2 same-page-indicator for links; the inactive
 * side omits the attribute entirely (no `aria-current="false"`).
 *
 * Styling — Orbitron via `font-display` matches the hero headline's visual
 * family; accent color follows `--color-accent`. Active side is opaque,
 * inactive side dims to 40% opacity. The separator is a thin 1px vertical
 * line using the same accent color at reduced opacity.
 */
interface LocaleToggleProps {
  /** Current locale of the page rendering the toggle. */
  locale: Locale;
  /** Dictionary slice used for aria labels in the current locale. */
  dict: Dictionary["toggle"];
}

export function LocaleToggle({ locale, dict }: LocaleToggleProps) {
  const [sceneIsContact, setSceneIsContact] = useState(false);

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

  if (sceneIsContact) return null;

  const ptIsActive = locale === "pt";
  const enIsActive = locale === "en";

  return (
    <nav
      aria-label={dict.label}
      className="label absolute left-6 top-6 z-30 flex items-center gap-3 text-corner uppercase tracking-[0.08em] text-(--color-accent) md:left-12 md:top-10"
    >
      <Link
        href="/"
        aria-label={dict.switchToPt}
        {...(ptIsActive ? { "aria-current": "page" as const } : {})}
        className={`transition-opacity hover:opacity-100 focus-visible:opacity-100 ${
          ptIsActive ? "opacity-100" : "opacity-40"
        }`}
      >
        PT
      </Link>
      <span aria-hidden="true" className="inline-block h-4 w-px bg-(--color-accent) opacity-30" />
      <Link
        href="/en"
        aria-label={dict.switchToEn}
        {...(enIsActive ? { "aria-current": "page" as const } : {})}
        className={`transition-opacity hover:opacity-100 focus-visible:opacity-100 ${
          enIsActive ? "opacity-100" : "opacity-40"
        }`}
      >
        EN
      </Link>
    </nav>
  );
}
