import Link from "next/link";

import { logout } from "@/app/admin/logout/actions";

interface AdminHeaderProps {
  email?: string;
}

/**
 * AdminHeader — mirrors SiteHeader container/height but omits public nav.
 *
 * Left: wordmark "mateushr." + mono caption "admin" in text-muted.
 * Right: when an email is provided (signed-in state), show the email in mono
 *        plus a "sair" text link bound to the logout Server Action (Next
 *        Server Actions carry built-in origin-check CSRF protection).
 *
 * Unlike SiteHeader this always shows its hairline bottom border (we're in
 * an authenticated mode — the border signals that context, not scroll state).
 */
export function AdminHeader({ email }: AdminHeaderProps) {
  return (
    <header
      id="admin-header"
      role="banner"
      className="sticky top-0 z-40 border-b border-border bg-primary/90 backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-container items-center justify-between px-5 md:px-12">
        <Link
          href="/"
          aria-label="mateushr — home"
          className="flex items-baseline gap-2 font-mono text-sm text-text"
        >
          <span className="inline-flex items-baseline">
            <span>mateushr</span>
            <span aria-hidden="true" className="text-accent">
              .
            </span>
          </span>
          <span aria-hidden="true" className="text-text-dim">
            /
          </span>
          <span className="text-text-muted">admin</span>
        </Link>

        {email ? (
          <div className="flex items-center gap-4 md:gap-6">
            <span
              title={email}
              className="hidden max-w-[200px] truncate font-mono text-sm text-text-muted md:inline"
            >
              {email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="font-mono text-sm text-text-muted transition-colors duration-200 hover:text-text"
              >
                sair
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
