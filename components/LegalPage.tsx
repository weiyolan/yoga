/** Privacy, terms, cancellation, cookies: one `legalPage` document each (Studio → Juridisch). */
import { Paragraphs } from "@/components/RichText";
import { SectionHead } from "@/components/sections";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { langParam } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { LEGAL_QUERY } from "@/sanity/queries";

export type LegalRoute = "privacy" | "terms" | "cancellation" | "cookies";

/** Fixed document ids, same as LEGAL_PAGES in studio/schemaTypes/singletons/legal-page.ts. */
const ID: Record<LegalRoute, string> = { privacy: "legal-privacy", terms: "legal-terms", cancellation: "legal-cancellation", cookies: "legal-cookies" };

const longDate = (lang: string, d: string) => new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "nl-BE", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

type Params = { params: Promise<{ lang: string }> };

/** `export const { generateMetadata, default } = legalPage("terms")` in each page folder. */
export function legalPage(route: LegalRoute) {
  async function generateMetadata({ params }: Params) {
    const lang = await langParam(params);
    const page = await sanityFetch({ query: LEGAL_QUERY, params: { id: ID[route] }, lang });
    return buildMetadata({ lang, route, seo: page?.seo, fallbackTitle: page?.title ?? getDictionary(lang).legal.titles[route] });
  }
  async function Page({ params }: Params) {
    const lang = await langParam(params);
    const page = await sanityFetch({ query: LEGAL_QUERY, params: { id: ID[route] }, lang });
    const t = getDictionary(lang).legal;
    return (
      <section className="s" style={{ borderTop: 0, paddingTop: 48 }}>
        <div className="wrap prose">
          <SectionHead label={t.label} title={page?.title ?? t.titles[route]} as="h1" />
          <Paragraphs text={page?.intro} className="muted" />
          {(page?.sections ?? []).map((s) => (
            <div key={s._key} className="block">
              {s.title ? <h2>{s.title}</h2> : null}
              <Paragraphs text={s.text} />
            </div>
          ))}
          {page?.updatedAt ? <p className="muted small">{`${t.updated} ${longDate(lang, page.updatedAt)}`}</p> : null}
        </div>
      </section>
    );
  }
  return { generateMetadata, Page };
}
