import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/metadata";
import { href, routes, type Route } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { SITEMAP_QUERY } from "@/sanity/queries";
import { defaultLanguage, languages } from "@/sanity/site.config";

/** The Sanity document behind each page (lastModified). */
const DOC: Record<Route, string> = {
  home: "homePage",
  retreats: "retreatsPage",
  lessons: "lessonsPage",
  about: "aboutPage",
  gallery: "galleryPage",
  contact: "contactPage",
  faq: "faqPage",
  privacy: "legal-privacy",
  terms: "legal-terms",
  cancellation: "legal-cancellation",
  cookies: "legal-cookies",
};

/** Every page in every language, with hreflang alternates (+ x-default) and when it last changed. Revalidated with the content. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { pages: docs, retreats } = await sanityFetch({ query: SITEMAP_QUERY });
  const updated = new Map(docs.map((d) => [d._id, d._updatedAt]));
  const pages: { route: Route; slug?: string; at?: string }[] = [
    ...(Object.keys(routes) as Route[]).map((route) => ({
      route,
      at: updated.get(DOC[route]),
    })),
    ...retreats
      .filter((r) => r.slug)
      .map((r) => ({
        route: "retreats" as const,
        slug: r.slug!,
        at: r._updatedAt,
      })),
  ];
  return pages.flatMap(({ route, slug, at }) =>
    languages.map((l) => ({
      url: siteUrl + href(l.id, route, { slug }),
      ...(at ? { lastModified: at } : {}),
      alternates: {
        languages: {
          ...Object.fromEntries(
            languages.map((a) => [a.id, siteUrl + href(a.id, route, { slug })]),
          ),
          "x-default": siteUrl + href(defaultLanguage, route, { slug }),
        },
      },
    })),
  );
}
