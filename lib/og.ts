/**
 * Share images (WhatsApp, Facebook, LinkedIn, X): `/og/<lang>/<page>.jpg`, rendered by app/og.
 * `<page>`: a route (`home`, `lessons`, …) or `retreat.<slug>`. 1200 × 630 JPEG, well under WhatsApp's ≈ 300 KB.
 */
import { getDictionary } from "./dictionary";
import type { Route } from "./routes";
import type { Lang } from "../sanity/site.config";

export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Sanity document behind each page (same as the sitemap). */
export const OG_DOC: Record<Route, string> = {
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

export const ogPath = (lang: Lang, route: Route, slug?: string) =>
  `/og/${lang}/${route === "retreats" && slug ? `retreat.${slug}` : route}.jpg`;

/** The label above the title: the page's name in the menu. */
export function ogEyebrow(lang: Lang, route: Route) {
  const d = getDictionary(lang);
  const nav = d.nav as Record<string, unknown>;
  const legal = d.legal.titles as Record<string, string>;
  return (
    (typeof nav[route] === "string" ? (nav[route] as string) : legal[route]) ??
    ""
  );
}
