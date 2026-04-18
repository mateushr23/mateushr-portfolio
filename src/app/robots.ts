import type { MetadataRoute } from "next";

// Base URL resolves from env so preview deploys advertise their own sitemap
// rather than pointing crawlers at production.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mateushr-portfolio.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/admin"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
