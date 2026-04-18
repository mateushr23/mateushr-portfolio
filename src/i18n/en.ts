import type { Dictionary } from "./types";

/**
 * English — secondary locale, served at `/en`.
 *
 * Translation notes:
 *  - "Hello fellow galaxy member" is the canonical English headline; the
 *    mono marker "A MESSAGE FROM EARTH" is already in English and stays.
 *  - SVG glyphs PRESS / SCROLL / CLICK are not translated — they're chrome.
 *  - The contact form heading was "Get in touch" in the original mock; kept
 *    that phrasing.
 */
export const en: Dictionary = {
  hero: {
    messageMarker: "A MESSAGE FROM EARTH",
    headline: "Hello fellow galaxy member",
    nameBanner: "I am Mateus",
    skipToContent: "Skip to main content",
  },
  presentation: {
    paragraph: "Software Engineer focused on digital products, AI, and full-stack systems.",
  },
  skills: {
    title: "Skills",
  },
  projects: {
    inviteHeadline: "How about a look at the projects?",
    inviteCta: "See projects",
    emptyDescription: "Description coming soon.",
    emptyList: "Projects being curated — check back soon.",
    prevLabel: "Previous project",
    nextLabel: "Next project",
  },
  contact: {
    corner: "Contact me",
    heading: "Get in touch",
    emailLabel: "Email",
    subjectLabel: "Subject",
    contentLabel: "Message",
    submit: "Send message",
    back: "Back",
  },
  nav: {
    entryNavLabel: "Main entry",
    entryLinkLabel: "Enter",
    socialNavLabel: "Social links",
    externalTabSuffix: " (opens in a new tab)",
  },
  toggle: {
    label: "Select language",
    switchToPt: "Switch to Portuguese",
    switchToEn: "Switch to English",
  },
  earth: {
    alt: "Earth with astronauts at the cardinal points",
  },
  meta: {
    title: "Mateus Henrique — Portfolio",
    description: "Portfolio of Mateus Henrique — TypeScript full-stack developer. Welcome, galaxy.",
    ogTitle: "Mateus Henrique — Portfolio",
    ogDescription: "Portfolio of Mateus Henrique — TypeScript full-stack developer.",
    ogLocale: "en_US",
    imageAlt: "Mateus Henrique — Portfolio",
  },
};
