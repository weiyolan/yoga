import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { urlFor, type Media } from "@/sanity/image";
import { defaultLanguage, languages, type Lang } from "@/sanity/site.config";
import { sanityFetch } from "@/sanity/fetch";
import { SETTINGS_QUERY } from "@/sanity/queries";
import { href, type Route } from "./routes";

type Seo = { title?: string | null; description?: string | null; shareImage?: Media | null } | null | undefined;

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

const ogImage = (m: Media | null | undefined) => {
  const url = m?.image?.asset?.url;
  if (!url) return undefined;
  return [{ url: url.startsWith("/") ? url : urlFor(m).width(1200).height(630).url(), width: 1200, height: 630, alt: m.alt || undefined }];
};

/**
 * Page metadata from the page's SEO object, falling back to Instellingen → Standaard SEO.
 * `fallbackTitle` (e.g. the hero title) is used when the page has no SEO title.
 */
export async function buildMetadata({ lang, route, slug, seo, fallbackTitle, fallbackImage }: { lang: Lang; route: Route; slug?: string; seo?: Seo; fallbackTitle?: string | null; fallbackImage?: Media | null }): Promise<Metadata> {
  const settings = await sanityFetch({ query: SETTINGS_QUERY, lang });
  const site = settings?.siteName ?? getDictionary(lang).siteName;
  const isHome = route === "home";
  const title = seo?.title ?? (isHome ? null : fallbackTitle);
  const description = seo?.description ?? settings?.seo?.description ?? settings?.tagline ?? undefined;
  const path = href(lang, route, { slug });
  const images = ogImage(seo?.shareImage) ?? ogImage(fallbackImage) ?? ogImage(settings?.seo?.shareImage);
  return {
    metadataBase: new URL(siteUrl),
    title: title ? `${title} · ${site}` : (settings?.seo?.title ?? site),
    description,
    alternates: {
      canonical: path,
      languages: { ...Object.fromEntries(languages.map((l) => [l.id, href(l.id, route, { slug })])), "x-default": href(defaultLanguage, route, { slug }) },
    },
    openGraph: { type: "website", siteName: site, title: title ?? site, description, url: path, locale: lang, images },
    twitter: { card: "summary_large_image" },
  };
}
