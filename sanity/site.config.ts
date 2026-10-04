/**
 * General settings shared by the Sanity Studio (`studio/`) and the Next.js frontend.
 *
 * Add a language here and it appears in every localized field in the Studio,
 * in the `Lang` type and in the fetcher's `lang` parameter.
 */
export const languages = [
  { id: "nl", title: "Nederlands" },
  { id: "en", title: "English" },
] as const;

export type Lang = (typeof languages)[number]["id"];

/** Required in the Studio; used as fallback when a translation is missing. */
export const defaultLanguage = "nl" as const; // literal type: GROQ queries embed it
const _defaultIsConfigured: Lang = defaultLanguage;

export const languageIds = languages.map((l) => l.id) as Lang[];

export function isLang(value: unknown): value is Lang {
  return languageIds.includes(value as Lang);
}

/** Pinned Content Lake API version (bump deliberately, never use "latest"). */
export const apiVersion = "2026-10-01";
