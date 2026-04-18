"use client";

import Image from "next/image";
import { useState } from "react";

import type { Dictionary, Locale } from "@/i18n";
import { safeRepoHref } from "@/lib/safe-url";
import type { Database } from "@/types/database";

/**
 * Scene 3 projects carousel. Replaces the invite card after the user clicks
 * the invite CTA. Two arrow buttons cycle through the project list with
 * wrap-around; the card content is wrapped in `aria-live="polite"` so screen
 * readers announce each project as the index changes.
 *
 * Data flow: repos are fetched in `src/app/page.tsx` (PT) and
 * `src/app/en/page.tsx` (EN) from the `repos` Supabase table and handed down
 * through SceneController → ProjectsScene. `stack`, `description_pt`, and
 * `description_en` come from the README-driven sync — the carousel holds no
 * hardcoded project data.
 *
 * Locale behaviour (i18n):
 *  - `locale="pt"` → prefers `description_pt`, falls back to `description_en`
 *    if PT is null, and finally to the dictionary's empty placeholder if both
 *    are null. This matches the repos fetched from the DB where every repo is
 *    expected to have at least one of the two columns populated.
 *  - `locale="en"` → mirrored: prefers `description_en`, falls back to PT.
 *
 * Loose coupling: the parent `ProjectsScene` owns the view toggle; this
 * component only owns the current index.
 */

type RepoRow = Database["public"]["Tables"]["repos"]["Row"];
// Minimal surface the carousel consumes. Keeping it narrower than the full
// Row makes it cheap to mock and makes it obvious which fields cross the
// RSC → Client boundary.
export type CarouselRepo = Pick<
  RepoRow,
  "github_id" | "name" | "description_pt" | "description_en" | "stack" | "url"
>;

interface ProjectsCarouselProps {
  repos: CarouselRepo[];
  locale: Locale;
  dict: Dictionary["projects"];
}

/**
 * Resolve which description string to render. Prefers the requested locale's
 * column and falls back to the other when the requested one is null. Returns
 * `null` when both columns are empty so the caller can decide whether to
 * render a placeholder.
 */
function selectDescription(repo: CarouselRepo, locale: Locale): string | null {
  if (locale === "en") {
    return repo.description_en ?? repo.description_pt ?? null;
  }
  return repo.description_pt ?? repo.description_en ?? null;
}

export function ProjectsCarousel({ repos, locale, dict }: ProjectsCarouselProps) {
  const [index, setIndex] = useState(0);

  const total = repos.length;
  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(total - 1, i + 1));

  if (total === 0) {
    return (
      <div className="flex w-full max-w-container items-center justify-center">
        <p className="mono text-message uppercase tracking-widest text-(--color-accent)/70">
          {dict.emptyList}
        </p>
      </div>
    );
  }

  // Clamp the index defensively — if the repos prop shrinks between
  // renders, `repos[index]` could otherwise be undefined.
  const safeIndex = Math.min(index, total - 1);
  const current = repos[safeIndex];
  const description = selectDescription(current, locale) ?? dict.emptyDescription;
  const stack = current.stack ?? [];
  const href = safeRepoHref(current.url);

  return (
    <div className="relative flex w-full max-w-container items-center justify-center gap-6 md:gap-10">
      <button
        type="button"
        onClick={prev}
        disabled={safeIndex === 0}
        aria-disabled={safeIndex === 0}
        aria-label={dict.prevLabel}
        className="shrink-0 opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Image
          src="/assets/space/arrow-glyph.svg"
          alt=""
          width={53}
          height={105}
          className="h-12 w-auto md:h-16"
        />
      </button>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="flex min-w-0 flex-1 flex-col items-center gap-5 text-center"
      >
        {/*
          `key={safeIndex}` remounts the card on each index change so the
          `reveal` entrance animation restarts and the new project visibly
          fades in — no useEffect plumbing needed.
        */}
        <div
          key={safeIndex}
          className="reveal flex flex-col items-center gap-5"
          style={{ ["--reveal-i" as string]: 0 }}
        >
          <p
            aria-hidden="true"
            className="mono text-message uppercase tracking-widest text-(--color-accent)/60"
          >
            {String(safeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
          <h3 className="text-balance font-display text-name font-semibold uppercase leading-tight tracking-[0.025em] text-(--color-accent)">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-(--color-accent) transition-colors hover:text-accent-bright"
              >
                {current.name}
              </a>
            ) : (
              current.name
            )}
          </h3>
          <p className="max-w-[72ch] text-(length:--text-body) leading-relaxed text-(--color-accent)">
            {description}
          </p>
          {stack.length > 0 ? (
            <ul className="flex flex-wrap items-center justify-center gap-2">
              {stack.map((tech) => (
                <li
                  key={tech}
                  className="glow-stroke border border-border px-4 py-2 text-click uppercase tracking-[0.04em] text-(--color-accent)"
                >
                  {tech}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={next}
        disabled={safeIndex === total - 1}
        aria-disabled={safeIndex === total - 1}
        aria-label={dict.nextLabel}
        className="shrink-0 opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Image
          src="/assets/space/arrow-glyph.svg"
          alt=""
          width={53}
          height={105}
          className="h-12 w-auto rotate-180 md:h-16"
        />
      </button>
    </div>
  );
}
