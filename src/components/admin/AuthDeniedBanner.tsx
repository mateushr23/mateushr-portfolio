import { FocusOnMount } from "./FocusOnMount";

/**
 * AuthDeniedBanner — rendered above the login form when /admin/login?error=denied
 * is present (callback finished but the email was not allowlisted).
 *
 * Never echoes the attempted email — the banner is generic on purpose so
 * an attacker can't confirm which addresses "almost" worked. role=alert
 * announces itself once, tabindex=-1 + focus-on-mount ensures screen
 * readers catch it.
 */
export function AuthDeniedBanner() {
  return (
    <FocusOnMount as="div">
      <div
        role="alert"
        tabIndex={-1}
        className="mono mb-8 border-l-2 border-danger pl-4 text-message text-danger focus:outline-none"
      >
        Este e-mail não tem permissão de acesso.
      </div>
    </FocusOnMount>
  );
}
