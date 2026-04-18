"use client";

/**
 * Decorative shooting-stars layer. Pure CSS animation — no JS loop, no
 * canvas, no libraries. Renders a handful of absolutely-positioned divs,
 * each styled as a thin diagonal streak (gradient tail + accent head glow)
 * translating diagonally across the viewport via a shared keyframe. Each
 * streak has its own inline `top` / `left` origin and `animationDelay` /
 * `animationDuration` so they stagger across a long window (10–25s between
 * streaks on average).
 *
 * Reduced-motion behavior: under `prefers-reduced-motion: reduce`, the CSS
 * in `globals.css` (same pattern the `.starfield` canvas uses) hides the
 * wrapper entirely — no streaks render at all. Decorative only; marked
 * `aria-hidden="true"` and `pointer-events: none`.
 *
 * Why z-0 (same layer as Starfield): both are ambient background elements
 * behind the main content (`main` sits at z-20). Keeping them co-planar
 * means shooting stars read as part of the same sky, not a foreground FX.
 */

type Streak = {
  top: string;
  left: string;
  delay: string;
  duration: string;
};

// Staggered delays keep only one streak on-screen at a time on average.
// Durations stay in the calm 1.2–1.6s window the spec asks for.
const STREAKS: readonly Streak[] = [
  { top: "12%", left: "88%", delay: "0s", duration: "1.4s" },
  { top: "28%", left: "72%", delay: "6s", duration: "1.3s" },
  { top: "8%", left: "55%", delay: "13s", duration: "1.5s" },
  { top: "22%", left: "40%", delay: "21s", duration: "1.2s" },
  { top: "35%", left: "92%", delay: "32s", duration: "1.6s" },
  { top: "18%", left: "65%", delay: "45s", duration: "1.4s" },
];

export function ShootingStars() {
  return (
    <div className="shooting-stars" aria-hidden="true">
      {STREAKS.map((streak, i) => (
        <span
          key={i}
          className="shooting-star"
          style={{
            top: streak.top,
            left: streak.left,
            animationDelay: streak.delay,
            animationDuration: streak.duration,
          }}
        />
      ))}
    </div>
  );
}
