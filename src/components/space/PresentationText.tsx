/**
 * Presentation text shown in scene 1 (after the user advances past the
 * GalaxyHeadline + NameBanner intro). TODO(user): replace the placeholder
 * copy below with Mateus's real bio — the current string is a stand-in so
 * the transition is visible during development.
 *
 * Kept as a Server Component: no hooks, no interactivity, pure markup.
 */
export function PresentationText() {
  return (
    <div
      className="reveal max-w-container text-balance text-center font-display text-name font-semibold uppercase leading-tight tracking-[0.025em] text-(--color-accent)"
      style={{ ["--reveal-i" as string]: 0 }}
    >
      {/* TODO(user): substitua por seu texto de apresentação */}
      Engenheiro de Software focado em produtos digitais, IA e sistemas full-stack.
    </div>
  );
}
