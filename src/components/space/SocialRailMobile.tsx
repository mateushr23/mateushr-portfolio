"use client";

import { GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";

import type { Dictionary } from "@/i18n";

/**
 * Mobile-only top-right chrome group. Renders GitHub + LinkedIn icons
 * followed by an inline "Fale comigo" / "Contact me" link as a single
 * flex row anchored to `absolute right-6 top-6` — producing the chrome
 * reading `[GH] [LI] Fale comigo`.
 *
 * This component co-locates the mobile social icons AND the corner
 * contact link inside one flex container so their spacing is governed by
 * `gap-4` rather than a hardcoded right-offset. That's the fix for the
 * prior drift: icons used to sit at `right-[8.5rem]` independently of
 * `ContactLink` at `right-6`, and the 8.5rem guess didn't match the real
 * rendered width of the PT/EN labels, letting the icons visually overlap
 * the PT|EN toggle. Now there's no offset math — icons and label flow
 * naturally in one container.
 *
 * The desktop `SocialRail` (vertical rail on the left edge) stays
 * completely untouched and carries `hidden md:block`. The desktop
 * `ContactLink` carries `hidden md:inline-block` so only this consolidated
 * nav renders on mobile. The `md` breakpoint is 768px (Tailwind v4 default).
 *
 * The contact link here duplicates the `scene:goto` click handler from
 * `ContactLink.tsx` — intentionally kept inline (rather than extracted)
 * because the logic is four lines and the duplication keeps the mobile
 * consolidation self-contained. If it grows, extract to a shared helper.
 *
 * Icon sizing: `h-5 w-5` (1.25rem ≈ 20px) chrome-scales the desktop 2.5rem
 * icons. Each anchor uses `p-1.5` (6px padding) → ~32px tap target meeting
 * WCAG 2.5.5. Gap between icons: `gap-3`. Gap between rightmost icon and
 * the label: `gap-4` on the wrapping nav.
 */
const SOCIAL_LINKS = [
  {
    key: "github",
    href: "https://github.com/mateushr23",
    name: "GitHub",
    Icon: GitHubLogoIcon,
  },
  {
    key: "linkedin",
    href: "https://linkedin.com/in/mateushribeiro",
    name: "LinkedIn",
    Icon: LinkedInLogoIcon,
  },
] as const;

interface SocialRailMobileProps {
  dict: Dictionary["nav"];
  /** Localized corner-link label — mirrors `ContactLink`'s `label`. */
  contactLabel: string;
}

export function SocialRailMobile({ dict, contactLabel }: SocialRailMobileProps) {
  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("scene:goto", { detail: { scene: 4 } }));
  };

  return (
    <nav
      aria-label={dict.socialNavLabel}
      className="absolute right-6 top-6 z-30 flex items-center gap-4 md:hidden"
    >
      <div className="flex items-center gap-3">
        {SOCIAL_LINKS.map(({ key, href, name, Icon }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name}${dict.externalTabSuffix}`}
            className="inline-flex items-center justify-center p-1.5 text-(--color-accent) transition-colors hover:text-accent-bright"
          >
            <Icon className="h-5 w-5" />
          </a>
        ))}
      </div>
      <a
        href="#contact"
        onClick={handleContactClick}
        className="label text-corner text-(--color-accent) transition-colors hover:text-accent-bright"
      >
        {contactLabel}
      </a>
    </nav>
  );
}
