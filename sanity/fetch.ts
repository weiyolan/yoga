/**
 * Typed Sanity fetcher.
 *
 *   const page = await sanityFetch({ query: RETREAT_BY_SLUG_QUERY, params: { slug }, lang });
 *   //    ^? RETREAT_BY_SLUG_QUERY_RESULT  (inferred from the query, no generics)
 *
 * Result types come from TypeGen (`cd studio && npm run typegen` → ./types.ts),
 * which registers every `defineQuery` string in the global `SanityQueries` map.
 * `$lang` is injected for every query and typed to the languages in site.config.
 */
import type { QueryParams } from "@sanity/client";
import { client } from "./client";
import { defaultLanguage, type Lang } from "./site.config";
import "./types";

/** Every query registered by TypeGen. */
export type Query = keyof SanityQueries;
/** Result type of a registered query. */
export type QueryResult<Q extends Query> = SanityQueries[Q];

/** `$name` parameters a query uses, except `$lang` (always injected). */
type IdentChar = "_" | Digit | Lower | Uppercase<Lower>;
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Lower = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";
type TakeIdent<S extends string, Acc extends string = ""> = S extends `${infer C}${infer R}` ? (C extends IdentChar ? TakeIdent<R, `${Acc}${C}`> : Acc) : Acc;
type ParamNames<S extends string, Acc extends string = never> = S extends `${string}$${infer Rest}` ? ParamNames<Rest, Acc | TakeIdent<Rest>> : Exclude<Acc, "lang">;

/** Params object required by a query (`{}` when it only uses `$lang`). */
export type QueryParamsOf<Q extends string> = [ParamNames<Q>] extends [never] ? Record<string, never> : { [K in ParamNames<Q>]: string | number | boolean };

type FetchOptions<Q extends Query> = {
  query: Q;
  lang?: Lang;
  /** Seconds; `false` = cache until a tag is revalidated. */
  revalidate?: number | false;
  /** Next.js cache tags, e.g. `["retreat", "retreat:dahab-2026"]`. */
  tags?: string[];
} & ([ParamNames<Q>] extends [never] ? { params?: Record<string, never> } : { params: QueryParamsOf<Q> });

export async function sanityFetch<const Q extends Query>({ query, params, lang = defaultLanguage, revalidate = 60, tags = [] }: FetchOptions<Q>): Promise<QueryResult<Q>> {
  const next = { revalidate: tags.length ? false : revalidate, tags };
  return client.fetch<QueryResult<Q>>(query, { ...(params as QueryParams), lang }, { next });
}

/** A retreat is upcoming until its last day is over (same rule as the queries). */
export function isUpcoming(endDate: string | null | undefined, now = new Date()) {
  return !!endDate && new Date(`${endDate}T23:59:59Z`) >= now;
}
