import Link from "next/link";

import { ScrollSentinel } from "./ScrollSentinel";

/**
 * SiteHeader — sticky top bar with monospace wordmark and minimal primary nav.
 * Backdrop-blur and hairline border are toggled by <ScrollSentinel> via a
 * `data-scrolled` attribute on the header element — keeping this component
 * server-rendered while still reacting to scroll.
 */
export function SiteHeader() {
  return (
    <>
      <ScrollSentinel targetId="site-header" />
      <header
        id="site-header"
        role="banner"
        data-scrolled="false"
        className="site-header sticky top-0 z-40 border-b border-transparent"
      >
        <div className="mx-auto flex h-16 max-w-container items-center justify-between px-5 md:px-12">
          <Link
            href="/"
            aria-label="mateushr — home"
            className="flex items-baseline font-mono text-sm text-text"
          >
            <span>mateushr</span>
            <span aria-hidden="true" className="text-accent">
              .
            </span>
          </Link>

          <nav aria-label="Primary">
            <ul className="flex items-center gap-6 md:gap-8">
              <li>
                <a
                  href="#projetos"
                  className="font-mono text-sm text-text-muted transition-colors duration-200 hover:text-text"
                >
                  projetos
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/in/mateushribeiro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-text-muted transition-colors duration-200 hover:text-text"
                >
                  sobre
                </a>
              </li>
              <li>
                <a
                  href="mailto:mateushr23@gmail.com"
                  className="font-mono text-sm text-text-muted transition-colors duration-200 hover:text-text"
                >
                  contato
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
