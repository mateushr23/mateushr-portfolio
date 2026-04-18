"use client";

/**
 * Top-right corner link ("Contact me" / "Fale comigo"). Rendered as live
 * Bebas Neue text rather than an SVG wordmark — keeps it a real link,
 * a11y-friendly, scale-perfect, and ~0 extra bytes.
 *
 * Behaviour: clicking dispatches a `scene:goto` CustomEvent with
 * `{ scene: 4 }`, which `SceneController` listens for and uses to jump
 * directly to the ContactForm scene. The `href="#contact"` fallback
 * preserves keyboard + screen-reader semantics (the anchor is still a
 * real link) and lets middle-click / open-in-new-tab degrade gracefully
 * — but the primary path is the JS handler that routes in-app.
 */
interface ContactLinkProps {
  /** Localized corner-link label (e.g. "Fale comigo" / "Contact me"). */
  label: string;
}

export function ContactLink({ label }: ContactLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("scene:goto", { detail: { scene: 4 } }));
  };

  return (
    <a
      href="#contact"
      onClick={handleClick}
      className="label absolute right-6 top-6 z-30 text-corner text-(--color-accent) transition-colors hover:text-accent-bright md:right-12 md:top-10"
    >
      {label}
    </a>
  );
}
