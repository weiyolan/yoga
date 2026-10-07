import { Paragraphs } from "@/components/RichText";
import { SectionHead } from "@/components/sections";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { langParam } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { PRIVACY_QUERY } from "@/sanity/queries";

const longDate = (lang: string, d: string) => new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "nl-BE", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">) {
  const lang = await langParam(params);
  const page = await sanityFetch({ query: PRIVACY_QUERY, lang });
  return buildMetadata({ lang, route: "privacy", seo: page?.seo, fallbackTitle: page?.title ?? getDictionary(lang).privacy.title });
}

/** Privacyverklaring (Studio → Pagina's → Privacyverklaring). */
export default async function Privacy({ params }: PageProps<"/[lang]/privacy">) {
  const lang = await langParam(params);
  const page = await sanityFetch({ query: PRIVACY_QUERY, lang });
  const t = getDictionary(lang).privacy;
  return (
    <section className="s" style={{ borderTop: 0, paddingTop: 48 }}>
      <div className="wrap prose">
        <SectionHead label={t.label} title={page?.title ?? t.title} as="h1" />
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
