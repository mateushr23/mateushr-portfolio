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
      <p className="mono text-message uppercase tracking-widest text-(--color-accent) opacity-70">
        ADMIN · ACESSO
      </p>
      <h1 className="font-display text-name font-bold uppercase leading-none tracking-[0.025em] text-(--color-accent)">
        link enviado
      </h1>
      <p className="text-message leading-[1.65] text-(--color-accent)/80">
        Se <strong className="mono text-accent-bright">{submittedEmail}</strong> estiver autorizado,
        o link foi enviado. Confira sua caixa de entrada.
      </p>
      <p className="mono text-sm text-(--color-accent)/60">O link expira em 10 minutos.</p>
      <FocusOnMount className="inline-flex w-fit">
        <a
          href="/admin/login"
          className="label mt-2 text-message uppercase tracking-[0.08em] text-(--color-accent)/80 underline-offset-4 transition-colors duration-200 hover:text-accent-bright hover:underline"
        >
          enviar novo link
        </a>
      </FocusOnMount>
    </div>
  );
}
