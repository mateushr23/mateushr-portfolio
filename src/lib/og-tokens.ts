/**
 * Open Graph design tokens. Keep in sync with `@theme` in
 * src/app/globals.css — these are used by the opengraph-image.tsx
 * handlers which can't read CSS custom properties at runtime.
 *
 * Only tokens actually duplicated across both OG files (PT and EN)
 * live here. One-off hex values (e.g. the radial-gradient dark hue,
 * the starfield white dot) stay inline in the handler.
 */
export const OG_TOKENS = {
  bg: "#000000",
  text: "#edeaf5",
  textMuted: "#8a82a8",
  accent: "#ceb7ff",
} as const;
