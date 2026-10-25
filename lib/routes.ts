/**
 * Public URLs. Dutch lives at the root, other languages under `/<lang>`.
 * Page folders in `app/[lang]` use the Dutch segment; `proxy.ts` maps the
 * localized segments below onto them.
 */
import { defaultLanguage, languageIds, type Lang } from "../sanity/site.config";

export const routes = {
  home: { nl: "", en: "" },
  retreats: { nl: "retreats", en: "retreats" },
  lessons: { nl: "lessen", en: "lessons" },
  about: { nl: "over-ons", en: "about" },
  gallery: { nl: "gallery", en: "gallery" },
  contact: { nl: "contact", en: "contact" },
  privacy: { nl: "privacy", en: "privacy" },
  terms: { nl: "voorwaarden", en: "terms" },
  cancellation: { nl: "annulatie", en: "cancellation" },
  cookies: { nl: "cookies", en: "cookies" },
} as const satisfies Record<string, Record<Lang, string>>;

/** Last segment of a retreat's sign-up page: `/retreats/<slug>/inschrijven`, `/en/retreats/<slug>/sign-up`. */
export const signupSegment = { nl: "inschrijven", en: "sign-up" } as const satisfies Record<Lang, string>;

export type Route = keyof typeof routes;

/** `href("en", "lessons", { hash: "planning" })` → `/en/lessons#planning` */
export function href(lang: Lang, route: Route, opts: { slug?: string | null; hash?: string } = {}) {
  const parts = [lang === defaultLanguage ? "" : lang, routes[route][lang], opts.slug ?? ""].filter(Boolean);
  return `/${parts.join("/")}${opts.hash ? `#${opts.hash}` : ""}`;
}

/** Retreat detail page. */
export const retreatHref = (lang: Lang, slug: string | null | undefined, hash?: string) => href(lang, "retreats", { slug, hash });

/** A retreat's sign-up page (also the waiting list when it's full). */
export const signupHref = (lang: Lang, slug: string | null | undefined) => href(lang, "retreats", { slug: slug ? `${slug}/${signupSegment[lang]}` : undefined });

/** Internal (Dutch) folder for a localized first segment, e.g. `about` → `over-ons`. */
export function internalSegment(lang: Lang, segment: string): string | undefined {
  const route = (Object.keys(routes) as Route[]).find((r) => routes[r][lang] === segment);
  return route && routes[route][defaultLanguage];
}

/** Parse a public pathname: `/en/about#x` → `{ lang: "en", route: "about", rest: [] }`. */
export function parsePath(pathname: string): { lang: Lang; route: Route | undefined; rest: string[] } {
  const parts = pathname.split(/[?#]/)[0].split("/").filter(Boolean);
  const lang = (languageIds as string[]).includes(parts[0]) && parts[0] !== defaultLanguage ? (parts.shift() as Lang) : defaultLanguage;
  if (parts[0] === defaultLanguage) parts.shift();
  const seg = parts.shift() ?? "";
  const route = (Object.keys(routes) as Route[]).find((r) => routes[r][lang] === seg || routes[r][defaultLanguage] === seg);
  return { lang, route, rest: parts };
}

/** Same page in another language (retreat slugs are shared across languages, the sign-up segment isn't). */
export function translatePath(pathname: string, to: Lang) {
  const { route, rest } = parsePath(pathname);
  const parts = rest.map((p, i) => (i === 1 && route === "retreats" && (Object.values(signupSegment) as string[]).includes(p) ? signupSegment[to] : p));
  return href(to, route ?? "home", { slug: parts.join("/") || undefined });
}

/** `[lang]` param → Lang (the layout already 404s on anything else). */
export async function langParam(params: Promise<{ lang: string }>): Promise<Lang> {
  const { lang } = await params;
  return (languageIds as string[]).includes(lang) ? (lang as Lang) : defaultLanguage;
}
