"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { MagicLinkState } from "@/app/admin/login/actions";

const ERROR_COPY: Record<NonNullable<MagicLinkState["error"]>, string> = {
  login_error_invalid: "E-mail inválido.",
  login_error_rate_limit: "Muitas tentativas. Espere 1 minuto.",
  login_error_generic: "Não foi possível enviar. Tente novamente.",
};

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
    <form action={formAction} noValidate className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="admin-login-email" className="font-mono text-sm text-text-muted">
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
          className="w-full border-b border-border bg-transparent px-0 py-3 font-mono text-base text-text outline-none transition-colors duration-200 placeholder:text-text-dim focus:border-accent"
        />
      </div>

      <SubmitButton />

      {errorMessage ? (
        <p
          role="alert"
          aria-live="polite"
          className="border-l-2 border-[color:var(--color-danger)] pl-3 font-mono text-sm text-[color:var(--color-danger)]"
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
      className="mt-2 inline-flex h-12 items-center justify-center border border-text px-6 font-mono text-sm uppercase tracking-[0.08em] text-text transition-colors duration-200 hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "enviando…" : "enviar link"}
    </button>
  );
}
