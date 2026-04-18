import type { Dictionary } from "./types";

/**
 * Portuguese (Brazil) — the portfolio's default locale. Served at `/`.
 *
 * Copy guidelines:
 *  - Keep headline / banner in ALL CAPS visual treatment via CSS (Tailwind's
 *    `uppercase`). Strings here are written in normal case so they remain
 *    correct for screen readers and OG previews; the component applies the
 *    visual transform.
 *  - The SVG glyphs PRESS / SCROLL / CLICK stay in English — they're universal
 *    UI chrome, not translatable copy, so there's no key for them here.
 */
export const pt: Dictionary = {
  hero: {
    messageMarker: "Uma mensagem da Terra",
    headline: "Olá, colega da galáxia",
    nameBanner: "Me chamo Mateus",
    skipToContent: "Pular para conteúdo principal",
  },
  presentation: {
    paragraph: "Engenheiro de Software focado em produtos digitais, IA e sistemas full-stack.",
  },
  skills: {
    title: "Skills",
  },
  projects: {
    inviteHeadline: "Que tal dar uma olhada nos projetos?",
    inviteCta: "Ver projetos",
    emptyDescription: "Descrição em breve.",
    emptyList: "Projetos em curadoria — volte em breve.",
    prevLabel: "Projeto anterior",
    nextLabel: "Próximo projeto",
  },
  contact: {
    corner: "Fale comigo",
    heading: "Fale comigo",
    emailLabel: "Email",
    subjectLabel: "Assunto",
    contentLabel: "Mensagem",
    submit: "Enviar mensagem",
    back: "Voltar",
  },
  nav: {
    entryNavLabel: "Entrada principal",
    entryLinkLabel: "Entrar",
    socialNavLabel: "Links sociais",
    externalTabSuffix: " (abre em nova aba)",
  },
  toggle: {
    label: "Selecionar idioma",
    switchToPt: "Mudar para português",
    switchToEn: "Mudar para inglês",
  },
  earth: {
    alt: "Terra com astronautas nos pontos cardeais",
  },
  meta: {
    title: "Mateus Henrique — Portfolio",
    description:
      "Portfólio de Mateus Henrique — desenvolvedor full-stack em TypeScript. Bem-vindo, galáxia.",
    ogTitle: "Mateus Henrique — Portfolio",
    ogDescription: "Portfólio de Mateus Henrique — desenvolvedor full-stack em TypeScript.",
    ogLocale: "pt_BR",
    imageAlt: "Mateus Henrique — Portfolio",
  },
};
