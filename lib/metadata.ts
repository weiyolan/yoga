import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import type { Media } from "@/sanity/image";
import { defaultLanguage, languages, type Lang } from "@/sanity/site.config";
import { sanityFetch } from "@/sanity/fetch";
import { SETTINGS_QUERY } from "@/sanity/queries";
import { OG_SIZE, ogPath } from "./og";
import { href, type Route } from "./routes";

type Seo =
  | {
      title?: string | null;
      description?: string | null;
      shareImage?: Media | null;
    }
  | null
  | undefined;

/**
 * Canonical origin (canonical URLs, hreflang, sitemap, Open Graph, structured data): NEXT_PUBLIC_SITE_URL,
 * else Netlify's production URL, else the live domain in a production build (never localhost in Google).
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.CONTEXT === "production" ? process.env.URL : undefined) ||
  (process.env.NODE_ENV === "production"
    ? "https://yogazentonic.com"
    : "http://localhost:3000")
).replace(/\/$/, "");

/** Netlify deploy previews and branch deploys (*.netlify.app) stay out of Google. */
export const indexable =
  !process.env.CONTEXT || process.env.CONTEXT === "production";

/** Open Graph locales (`og:locale` wants language_TERRITORY). */
const OG_LOCALE: Record<Lang, string> = { nl: "nl_BE", en: "en_GB" };

/** Plain text → one line of at most `max` characters, cut at a word ("…"). Google shows ≈155. */
export function clip(text: string | null | undefined, max = 155) {
  const s = (text ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s || undefined;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : cut.length).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** Sentences → one text: “a” + “b.” → “a. b.” (no doubled full stops). */
export const sentences = (...parts: (string | null | undefined)[]) =>
  parts
    .map((p) => p?.trim())
    .filter(Boolean)
    .map((p) => (/[.!?…:]$/.test(p!) ? p : `${p}.`))
    .join(" ");

/**
 * Page metadata from the page's SEO object (Studio → the page → “SEO & delen”).
 * Missing title → `fallbackTitle` (e.g. the hero title). Missing description → `fallbackDescription`
 * (the page's own intro text, so no two pages share one), then Algemeen → Standaard SEO.
 */
export async function buildMetadata({
  lang,
  route,
  slug,
  seo,
  fallbackTitle,
  fallbackDescription,
  type = "website",
}: {
  lang: Lang;
  route: Route;
  slug?: string;
  seo?: Seo;
  fallbackTitle?: string | null;
  fallbackDescription?: string | null;
  type?: "website" | "article";
}): Promise<Metadata> {
  const settings = await sanityFetch({ query: SETTINGS_QUERY, lang });
  const site = settings?.siteName ?? getDictionary(lang).siteName;
  const isHome = route === "home";
  // Home: “Yoga, Zen & Tonic · <SEO title>” (else Standaard SEO → titel); other pages: “<title> · Yoga, Zen & Tonic”.
  const title = seo?.title ?? (isHome ? null : fallbackTitle);
  const fullTitle = isHome
    ? title
      ? `${site} · ${title}`
      : (settings?.seo?.title ??
        (settings?.tagline ? `${site} · ${settings.tagline}` : site))
    : title
      ? `${title} · ${site}`
      : (settings?.seo?.title ?? site);
  const description =
    clip(seo?.description) ??
    clip(fallbackDescription) ??
    clip(settings?.seo?.description) ??
    clip(settings?.tagline);
  const path = href(lang, route, { slug });
  // The share card (app/og): the page's photo (SEO → Deelafbeelding, else its opening photo) + site name, title and one line.
  const images = [
    {
      url: ogPath(lang, route, slug),
      width: OG_SIZE.width,
      height: OG_SIZE.height,
      type: "image/jpeg",
      alt: title ?? fullTitle,
    },
  ];
  return {
    metadataBase: new URL(siteUrl),
    title: fullTitle,
    description,
    alternates: {
      canonical: path,
      languages: {
        ...Object.fromEntries(
          languages.map((l) => [l.id, href(l.id, route, { slug })]),
        ),
        "x-default": href(defaultLanguage, route, { slug }),
      },
    },
    openGraph: {
      type,
      siteName: site,
      title: title ?? fullTitle,
      description,
      url: path,
      locale: OG_LOCALE[lang],
      alternateLocale: languages
        .filter((l) => l.id !== lang)
        .map((l) => OG_LOCALE[l.id]),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? fullTitle,
      description,
      images: images.map((i) => i.url),
    },
  };
}
