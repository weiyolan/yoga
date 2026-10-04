/**
 * Compile-time checks for the typed fetcher (run by `npx tsc --noEmit`, never executed).
 */
import { sanityFetch } from "./fetch";
import { GALLERY_QUERY, HOME_QUERY, RETREAT_BY_SLUG_QUERY, RETREAT_SLUGS_QUERY } from "./queries";
import type { Lang } from "./site.config";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const assert = <T extends true>() => undefined as unknown as T;

export async function checks() {
  const retreat = await sanityFetch({ query: RETREAT_BY_SLUG_QUERY, params: { slug: "dahab-2026" }, lang: "en" });
  assert<Equal<typeof retreat extends null ? never : NonNullable<typeof retreat>["title"], string | null>>();
  assert<Equal<NonNullable<typeof retreat>["highlights"], string[]>>();

  const slugs = await sanityFetch({ query: RETREAT_SLUGS_QUERY });
  assert<Equal<typeof slugs, Array<string | null>>>();

  const home = await sanityFetch({ query: HOME_QUERY });
  home?.featuredRetreat?.cardPhoto?.image?.asset?.metadata?.lqip satisfies string | null | undefined;

  const gallery = await sanityFetch({ query: GALLERY_QUERY, lang: "nl" });
  gallery.photos[0]?.categories satisfies Array<string> | null | undefined;

  // @ts-expect-error: $slug is required
  await sanityFetch({ query: RETREAT_BY_SLUG_QUERY });
  // @ts-expect-error: only configured languages
  await sanityFetch({ query: HOME_QUERY, lang: "fr" });
  // @ts-expect-error: unknown query strings are rejected
  await sanityFetch({ query: `*[_type == "nope"]` });

  const lang: Lang = "nl";
  return lang;
}
