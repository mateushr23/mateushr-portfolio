import type { Metadata } from "next";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AuthDeniedBanner } from "@/components/admin/AuthDeniedBanner";
import { MagicLinkConfirmation } from "@/components/admin/MagicLinkConfirmation";
import { MagicLinkForm } from "@/components/admin/MagicLinkForm";

import { requestMagicLink } from "./actions";

export const metadata: Metadata = {
  title: "Admin · entrar",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  sent?: string;
  email?: string;
  error?: string;
}>;

const EMAIL_ECHO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function decodeEmail(b64: string | undefined): string {
  if (!b64) return "";
  try {
    const decoded = Buffer.from(b64, "base64url").toString("utf8");
    // Re-validate: an attacker can craft an arbitrary base64 payload and
    // drop it into ?email=. React auto-escapes it, so XSS is blocked, but
    // we still want to refuse non-email echoes so the confirmation page
    // can't be weaponized for phishing with arbitrary content.
    return EMAIL_ECHO_REGEX.test(decoded) && decoded.length <= 254 ? decoded : "";
  } catch {
    return "";
  }
}

/**
 * /admin/login — public route. Three possible states:
 *
 *   ?sent=1&email=<b64>  → MagicLinkConfirmation
 *   ?error=denied        → AuthDeniedBanner + MagicLinkForm
 *   (default)            → MagicLinkForm
 *
 * The page is noindex'd via metadata; proxy.ts additionally sets
 * X-Robots-Tag on the response.
 */
export default async function AdminLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const denied = params.error === "denied";
  const submittedEmail = sent ? decodeEmail(params.email) : "";

  return (
    <>
      <a href="#admin-main" className="skip-link">
        Pular para conteúdo
      </a>
      <AdminHeader />
      <main
        id="admin-main"
        className="relative z-10 flex min-h-[calc(100dvh-64px)] items-center justify-center px-5 py-16"
      >
        <div className="flex w-full max-w-[420px] flex-col gap-8">
          {sent && submittedEmail ? (
            <MagicLinkConfirmation submittedEmail={submittedEmail} />
          ) : (
            <>
              {denied ? <AuthDeniedBanner /> : null}
              <div className="flex flex-col gap-6">
                <p className="eyebrow">ADMIN · ACESSO</p>
                <h1 className="font-display text-h1 italic leading-[1.05] text-text">entrar</h1>
                <p className="text-base leading-[1.65] text-text-muted">
                  Digite seu e-mail. Se estiver autorizado, enviaremos um link de acesso válido por
                  10 minutos.
                </p>
              </div>
              <MagicLinkForm action={requestMagicLink} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
