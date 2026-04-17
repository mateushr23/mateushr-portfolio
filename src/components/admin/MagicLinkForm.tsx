"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { MagicLinkState } from "@/app/admin/login/actions";

const ERROR_COPY: Record<NonNullable<MagicLinkState["error"]>, string> = {
  login_error_invalid: "E-mail inválido.",
  login_error_rate_limit: "Muitas tentativas. Espere 1 minuto.",
  login_error_provider_rate_limit: "Limite de envios atingido. Tente novamente em 1 hora.",
  login_error_generic: "Não foi possível enviar. Tente novamente.",
};

// Mirrors the INPUT_CLASS constant in ContactForm.tsx so admin + public
// inputs render identically (space theme parity).
const INPUT_CLASS =
  "w-full border border-[color:var(--color-border)] bg-transparent px-4 py-3 text-[length:var(--text-click)] text-[color:var(--color-accent)] placeholder:text-[color:var(--color-accent)]/40 focus:outline-none focus:border-[color:var(--color-accent-bright)]";

interface MagicLinkFormProps {
  action: (prev: MagicLinkState | undefined, formData: FormData) => Promise<MagicLinkState>;
}

/**
 * MagicLinkForm — email capture + submit. React 19 useActionState gives us
 * a return-value channel for validation / transient failures without
 * exposing whether the email is allowlisted (server action redirects on
 * the always-send path instead of returning state).
 *
 * useFormStatus drives the pending UI — the button's label and aria-busy
 * flip while the server action is in flight.
 */
export function MagicLinkForm({ action }: MagicLinkFormProps) {
  const [state, formAction] = useActionState<MagicLinkState | undefined, FormData>(
    action,
    undefined
  );

  const errorMessage = state?.error ? ERROR_COPY[state.error] : null;

  return (
    <form action={formAction} noValidate className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="admin-login-email"
          className="label text-message uppercase tracking-[0.08em] text-(--color-accent)"
        >
          e-mail
        </label>
        <input
          id="admin-login-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="voce@exemplo.com"
          className={INPUT_CLASS}
        />
      </div>

      <SubmitButton />

      {errorMessage ? (
        <p
          role="alert"
          aria-live="polite"
          className="mono border-l-2 border-danger pl-3 text-message text-danger"
        >
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="label inline-flex items-center gap-4 self-start text-corner uppercase tracking-[0.08em] text-(--color-accent) transition-colors duration-200 hover:text-accent-bright disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "enviando…" : "enviar link"}
    </button>
  );
}
