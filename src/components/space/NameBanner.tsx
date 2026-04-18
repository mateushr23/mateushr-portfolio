import type { Dictionary } from "@/i18n";

/**
 * The signature moment: "I AM MATEUS" rendered in Orbitron with the
 * lavender text-stroke + 4s pulse-glow halo. Semantically an h2 — the
 * h1 is GalaxyHeadline. Quality bar: if this doesn't render as a quiet
 * heartbeat, the page has failed.
 */
interface NameBannerProps {
  dict: Dictionary["hero"];
}

export function NameBanner({ dict }: NameBannerProps) {
  return (
    <h2
      className="glow-stroke pulse-glow reveal font-display text-name font-bold uppercase leading-none tracking-[0.06em]"
      style={{ ["--reveal-i" as string]: 1 }}
    >
      {dict.nameBanner}
    </h2>
  );
}
