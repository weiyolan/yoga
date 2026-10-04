/**
 * Public URLs → prerendered pages in app/[lang] (rewrites only, pages stay static).
 *
 *   /retreats            → /nl/retreats        (Dutch at the root)
 *   /nl/retreats         → 308 /retreats       (one URL per page)
 *   /en/lessons          → /en/lessen          (localized segment → Dutch folder)
 *   /en/lessen           → 308 /en/lessons
 */
import { NextResponse, type NextRequest } from "next/server";
import { internalSegment, routes, type Route } from "@/lib/routes";
import { defaultLanguage, isLang, type Lang } from "@/sanity/site.config";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const [first, ...rest] = url.pathname.split("/").filter(Boolean);

  if (first === defaultLanguage) {
    url.pathname = `/${rest.join("/")}`;
    return NextResponse.redirect(url, 308);
  }

  const lang: Lang = isLang(first) ? first : defaultLanguage;
  const parts = isLang(first) ? rest : [first, ...rest].filter(Boolean);

  if (lang !== defaultLanguage && parts[0]) {
    // Dutch segment under another language → its localized URL.
    const route = (Object.keys(routes) as Route[]).find((r) => routes[r][defaultLanguage] === parts[0] && routes[r][lang] !== parts[0]);
    if (route) {
      url.pathname = `/${[lang, routes[route][lang], ...parts.slice(1)].join("/")}`;
      return NextResponse.redirect(url, 308);
    }
    parts[0] = internalSegment(lang, parts[0]) ?? parts[0];
  }

  url.pathname = `/${[lang, ...parts].join("/")}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Everything except API routes, the Studio (/studio), Next internals and files with an extension.
  matcher: ["/((?!api|studio|_next|__fixture|.*\\..*).*)"],
};
