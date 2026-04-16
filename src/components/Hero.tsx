/**
 * Hero — editorial display section. Type-first, no image, no avatar.
 * Staggered reveal is pure CSS: each child sets a --reveal-i index and
 * inherits the animation-delay from the .reveal class in globals.css.
 *
 * Italic scoping: both "usuário" and "produto" use <em> for Fraunces italic
 * + opsz 144 (the editorial italic). Only "produto" gets the WONK swash
 * via the `.wonk` utility — that single signature detail is reserved for
 * the one anchor word per the handoff (copy.hero_headline_wonky_word).
 */
export function Hero() {
  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-container flex-col items-start justify-center gap-6 px-5 md:px-12"
    >
      <p className="eyebrow reveal" style={{ "--reveal-i": 0 } as React.CSSProperties}>
        DESENVOLVEDOR · SÃO PAULO · ABRIL 2026
      </p>

      <h1
        id="hero-title"
        // xl:-ml-1.5 = -6px optical correction at xl+ only. Fraunces display
        // at --text-display-xl has a visible left sidebearing on capital
        // "D" that makes the headline look inset from the eyebrow/paragraph
        // below it. Removing this class reintroduces the misalignment.
        className="reveal font-display text-display-xl leading-[0.95] tracking-[-0.035em] text-text xl:-ml-1.5"
        style={{ "--reveal-i": 1 } as React.CSSProperties}
      >
        Da ideia ao <em>usuário</em>.
        <br />
        Engenharia com visão de <em className="wonk">produto</em>.
      </h1>

      <p
        className="reveal max-w-[62ch] text-[1.125rem] leading-[1.65] tracking-[-0.005em] text-text-muted"
        style={{ "--reveal-i": 2 } as React.CSSProperties}
      >
        Full-stack em TypeScript — React, Next.js, Node e Postgres. Atualmente disponível para CLT
        em São Paulo ou remoto no Brasil.
      </p>

      <a
        href="#projetos"
        className="reveal group/cta inline-flex items-center gap-2 font-mono text-sm text-text transition-colors duration-200 hover:text-accent"
        style={{ "--reveal-i": 3 } as React.CSSProperties}
      >
        <span className="name-link">ver projetos</span>
        <span
          aria-hidden="true"
          className="transition-transform duration-200 group-hover/cta:translate-y-0.5"
        >
          ↓
        </span>
      </a>
    </section>
  );
}
