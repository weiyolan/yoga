import type { CSSProperties, ElementType } from "react";

/** A piece of bilingual copy. The NL string is the server-rendered default;
 *  SiteScripts swaps to `en` client-side via the data-nl/data-en attributes. */
export type Lang = { nl: string; en: string };

/**
 * Renders a single element carrying the `data-nl` / `data-en` attributes the
 * site's client-side i18n (SiteScripts.applyLang) reads. Pass `html` for copy
 * that contains inline markup (e.g. <b>…</b>) — it mirrors the prototype's
 * `data-html` opt-in and is initially painted with the NL variant.
 */
export default function Bi({
  as,
  t,
  html = false,
  className,
  style,
}: {
  as?: ElementType;
  t: Lang;
  html?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const Tag = as ?? "span";
  const common = { className, style, "data-nl": t.nl, "data-en": t.en };
  if (html) {
    return <Tag {...common} data-html="" dangerouslySetInnerHTML={{ __html: t.nl }} />;
  }
  return <Tag {...common}>{t.nl}</Tag>;
}
