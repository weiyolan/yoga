/**
 * Placeholders: text in [brackets] that still has to be filled in, e.g. “[IBAN]”, “[termijnen]”.
 * Used by the field warnings (schemaTypes/shared/i18n.ts), Studio → “Nog in te vullen” and
 * scripts/publish-drafts.ts. Only text values count; keys starting with `_` (ids, types) are skipped.
 */
const PLACEHOLDER = /\[[^[\]\n]{1,60}\]/g;

export function placeholders(value: unknown): string[] {
  const found = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === "string") for (const m of v.match(PLACEHOLDER) ?? []) found.add(m);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (!k.startsWith("_")) walk(x);
  };
  walk(value);
  return [...found];
}
