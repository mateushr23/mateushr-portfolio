import type { MetadataRoute } from "next";

// Base URL resolves from env so preview deploys and custom domains don't leak
// the production URL into the sitemap. Production default is the Vercel alias.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mateushr-portfolio.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];
}
