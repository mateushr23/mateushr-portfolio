import type { MetadataRoute } from "next";

// Base URL resolves from env so preview deploys and custom domains don't leak
// the production URL into the sitemap. Production default is the Vercel alias.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mateushr-portfolio.vercel.app";

/**
 * Sitemap. Lists the two locale entries:
 *   - `/`    → Portuguese (default, priority 1.0)
 *   - `/en`  → English (priority 0.9 — same content, secondary locale)
 *
 * Google uses the priority + hreflang signals from each page's metadata
 * (`alternates.languages` in `src/app/page.tsx` and `src/app/en/page.tsx`)
 * to group the two URLs as translations of the same resource. Keeping both
 * in the sitemap ensures the EN variant is discovered even if the crawler
 * arrives at the PT page first.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/en`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
