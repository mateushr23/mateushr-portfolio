/**
 * i18n type definitions. The portfolio supports two locales:
 *   - "pt" → Portuguese (default, served at `/`)
 *   - "en" → English (served at `/en`)
 *
 * The default site URL (no locale prefix) stays Portuguese, so there is no
 * `/pt` route; English is the only prefixed locale. The `Locale` string union
 * is deliberately narrow so TypeScript catches unknown locale strings at
 * compile time.
 *
 * `Dictionary` is the exhaustive shape every locale file must satisfy. Adding
 * a key here forces both `pt.ts` and `en.ts` to implement it — that's the
 * single-source-of-truth contract that keeps translations in sync.
 *
 * Keys are organised by feature (hero, presentation, skills, projects,
 * contact, nav, meta, toggle) rather than by page — features can move
 * between pages, namespaces should be stable.
 */
export type Locale = "pt" | "en";

export const LOCALES: readonly Locale[] = ["pt", "en"] as const;
export const DEFAULT_LOCALE: Locale = "pt";

export interface Dictionary {
  hero: {
    /** Kept in English on both sides — rendered as a display wordmark. */
    messageMarker: string;
    /** Headline: "Hello fellow galaxy member" / "Olá, colega da galáxia" */
    headline: string;
    /** "I am Mateus" / "Eu sou Mateus" */
    nameBanner: string;
    /** Skip-to-content link for screen readers */
    skipToContent: string;
  };
  presentation: {
    /** Single uppercase paragraph shown in scene 1 */
    paragraph: string;
  };
  skills: {
    /** Section label — stays "Skills" on the PT side too (it's a tech term). */
    title: string;
  };
  projects: {
    /** Scene 3 invite text */
    inviteHeadline: string;
    /** Invite CTA (e.g. "Ver projetos" / "See projects") */
    inviteCta: string;
    /** Shown when the carousel's `description_*` column is null for a repo */
    emptyDescription: string;
    /** Shown when zero repos are returned from the DB */
    emptyList: string;
    /** aria-label for the previous-arrow button */
    prevLabel: string;
    /** aria-label for the next-arrow button */
    nextLabel: string;
  };
  contact: {
    /** Top-right corner link "Contact me" / "Fale comigo" */
    corner: string;
    /** Form heading ("Get in touch" / "Fale comigo") */
    heading: string;
    emailLabel: string;
    subjectLabel: string;
    contentLabel: string;
    submit: string;
    /** Back button on the contact scene */
    back: string;
  };
  nav: {
    /** aria-label on the main-entry wrapper around the CLICK glyph */
    entryNavLabel: string;
    /** aria-label on the CLICK-to-open anchor */
    entryLinkLabel: string;
    /** aria-label on the social-rail <nav> */
    socialNavLabel: string;
    /** Social link aria suffix (e.g. " (opens in a new tab)") */
    externalTabSuffix: string;
  };
  toggle: {
    /** aria-label for the locale-toggle wrapper */
    label: string;
    /** aria-label for the PT option when EN is active */
    switchToPt: string;
    /** aria-label for the EN option when PT is active */
    switchToEn: string;
  };
  earth: {
    /** alt text for the earth-astronauts image */
    alt: string;
  };
  meta: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogLocale: string;
    imageAlt: string;
  };
}
