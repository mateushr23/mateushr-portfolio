import { FocusOnMount } from "./FocusOnMount";

interface MagicLinkConfirmationProps {
  submittedEmail: string;
}

/**
 * MagicLinkConfirmation — rendered when /admin/login receives ?sent=1.
 *
 * Copy is intentionally conditional ("Se {email} estiver autorizado…")
 * because the server action redirects here regardless of allowlist
 * membership. The email is echoed in mono to feel like system output,
 * never affirming that it was the "right" email.
 *
 * Focus is moved to the resend anchor on mount so keyboard users land on
 * a real control and screen readers announce the actionable link.
 */
export function MagicLinkConfirmation({ submittedEmail }: MagicLinkConfirmationProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <p className="eyebrow">ADMIN · ACESSO</p>
      <h1 className="font-display text-h1 italic leading-[1.05] text-text">link enviado</h1>
      <p className="text-base leading-[1.65] text-text-muted">
        Se <strong className="font-mono text-text">{submittedEmail}</strong> estiver autorizado, o
        link foi enviado. Confira sua caixa de entrada.
      </p>
      <p className="font-mono text-sm text-text-dim">O link expira em 10 minutos.</p>
      <FocusOnMount className="inline-flex w-fit">
        <a
          href="/admin/login"
          className="mt-2 font-mono text-sm text-text-muted underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
        >
          enviar novo link
        </a>
      </FocusOnMount>
    </div>
  );
}
