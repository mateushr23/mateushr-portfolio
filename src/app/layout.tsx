import type { Metadata } from "next";
import { Bebas_Neue, Fraunces, Geist, JetBrains_Mono, Orbitron } from "next/font/google";
import { headers } from "next/headers";

import { getLocaleFromPathname } from "@/i18n";

import "./globals.css";

// Orbitron — display sci-fi face (variable weight). Used for hero + CLICK
// boxes + I AM MATEUS glow-stroke. Kept as explicit weights for safety
// across next/font versions; Orbitron is exposed as a variable on Google
// but the weights array locks the subset we actually use.
const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bebas-neue",
  weight: ["400"],
});

// Kept loaded globally so future /sobre or /projects pages can reintroduce
// editorial serif without refactoring layout.tsx. Unused on home.
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
});

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
});

// metadataBase is required in Next 16 so that relative image URLs (e.g. the
// auto-generated /opengraph-image route) resolve to absolute URLs in the
// rendered <meta> tags. Fallback is the Vercel alias; override via
// NEXT_PUBLIC_SITE_URL on preview/custom domains.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mateushr-portfolio.vercel.app";

// Root layout holds only metadata that applies to every route under the
// domain (metadataBase + fallback title/description). Page-specific
// OpenGraph, canonical, hreflang, and locale-aware copy live in each
// page's `generateMetadata` export (see `src/app/page.tsx` and
// `src/app/en/page.tsx`). Next merges parent + child metadata automatically.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mateus Henrique — Portfolio",
    template: "%s | Mateus Henrique",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `headers()` is async in Next 15+. The `x-pathname` header is set by
  // the proxy middleware (src/proxy.ts) on every matched request so the
  // server layout knows which route segment is rendering — Next 16 only
  // allows the ROOT layout to render <html>, so the locale signal has to
  // bubble up here. If the header is missing (shouldn't happen, but defensive
  // against edge cases like robots.ts / sitemap.ts running outside the
  // middleware matcher), we fall back to the PT default.
  const h = await headers();
  const pathname = h.get("x-pathname");
  const htmlLang = getLocaleFromPathname(pathname) === "en" ? "en" : "pt-BR";

  return (
    <html
      lang={htmlLang}
      className={`${orbitron.variable} ${bebasNeue.variable} ${fraunces.variable} ${geist.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
