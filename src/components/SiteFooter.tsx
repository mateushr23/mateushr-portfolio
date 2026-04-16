import { EnvelopeClosedIcon, GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";

/**
 * SiteFooter — thin editorial band. Identity line + three icon-only contact
 * links on the left, legal microcopy on the right. No newsletter, no sitemap,
 * no "back to top" button.
 */
export function SiteFooter() {
  return (
    <footer
      role="contentinfo"
      className="mx-auto max-w-container border-t border-border px-5 py-12 md:px-12"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto] md:items-end md:gap-8">
        <div className="flex flex-col gap-4">
          <p className="font-mono text-sm text-text-muted">mateus henrique · são paulo, brasil</p>

          <ul role="list" className="flex items-center gap-5">
            <li>
              <a
                href="https://github.com/mateushr23"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center text-text-muted transition-colors duration-200 hover:text-accent"
              >
                <GitHubLogoIcon width={18} height={18} />
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com/in/mateushr"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center text-text-muted transition-colors duration-200 hover:text-accent"
              >
                <LinkedInLogoIcon width={18} height={18} />
              </a>
            </li>
            <li>
              <a
                href="mailto:mateushr23@gmail.com"
                aria-label="Email"
                className="inline-flex h-11 w-11 items-center justify-center text-text-muted transition-colors duration-200 hover:text-accent"
              >
                <EnvelopeClosedIcon width={18} height={18} />
              </a>
            </li>
          </ul>
        </div>

        <p className="font-mono text-[0.75rem] text-text-dim">
          © 2026 · construído com next.js + supabase
        </p>
      </div>
    </footer>
  );
}
