import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/metadata";
import { href, routes, type Route } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { RETREAT_SLUGS_QUERY } from "@/sanity/queries";
import { languages } from "@/sanity/site.config";

/** Every page in every language, with hreflang alternates. Revalidated with the content. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = (await sanityFetch({ query: RETREAT_SLUGS_QUERY })).filter(Boolean) as string[];
  const pages: { route: Route; slug?: string }[] = [...(Object.keys(routes) as Route[]).map((route) => ({ route })), ...slugs.map((slug) => ({ route: "retreats" as const, slug }))];
  return pages.flatMap(({ route, slug }) =>
    languages.map((l) => ({
      url: siteUrl + href(l.id, route, { slug }),
      alternates: { languages: Object.fromEntries(languages.map((a) => [a.id, siteUrl + href(a.id, route, { slug })])) },
    })),
  );
}
