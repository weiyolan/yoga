import type { MetadataRoute } from "next";
import { indexable, siteUrl } from "@/lib/metadata";

/** Everything but the API and the Studio; a Netlify preview / branch deploy: nothing. */
export default function robots(): MetadataRoute.Robots {
  if (!indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/studio"] },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
