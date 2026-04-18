import type { Dictionary } from "@/i18n";

/**
 * Presentation text shown in scene 1 (after the user advances past the
 * GalaxyHeadline + NameBanner intro). Copy is provided by the locale
 * dictionary so the PT and EN routes can render their own paragraph
 * without duplicating markup.
 *
 * Kept as a Server Component: no hooks, no interactivity, pure markup.
 */
interface PresentationTextProps {
  dict: Dictionary["presentation"];
}

export function PresentationText({ dict }: PresentationTextProps) {
  return (
    <div
      className="reveal max-w-container text-balance text-center font-display text-name font-semibold uppercase leading-tight tracking-[0.025em] text-(--color-accent)"
      style={{ ["--reveal-i" as string]: 0 }}
    >
      {dict.paragraph}
    </div>
  );
}
