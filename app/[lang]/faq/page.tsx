import Link from "next/link";
import { notFound } from "next/navigation";
import { Paragraphs } from "@/components/RichText";
import { SectionHead } from "@/components/sections";
import { JsonLd } from "@/components/JsonLd";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { href, langParam } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { FAQ_QUERY } from "@/sanity/queries";

export async function generateMetadata({ params }: PageProps<"/[lang]/faq">) {
  const lang = await langParam(params);
  const page = await sanityFetch({ query: FAQ_QUERY, lang });
  return buildMetadata({ lang, route: "faq", seo: page?.seo, fallbackTitle: page?.title || getDictionary(lang).faq.title, fallbackDescription: page?.intro });
}

/** Veelgestelde vragen (Studio → Pagina's → Veelgestelde vragen): fold-out answers per group + FAQPage data for Google. */
export default async function Faq({ params }: PageProps<"/[lang]/faq">) {
  const lang = await langParam(params);
  const page = await sanityFetch({ query: FAQ_QUERY, lang });
  const t = getDictionary(lang).faq;
  const groups = (page?.groups ?? []).map((g) => ({ ...g, items: (g.items ?? []).filter((i) => i.question && i.answer) })).filter((g) => g.items.length);
  if (!page || !groups.length) notFound();
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) => g.items.map((i) => ({ "@type": "Question", name: i.question, acceptedAnswer: { "@type": "Answer", text: i.answer } }))),
  };
  return (
    <section className="s" style={{ borderTop: 0, paddingTop: 48 }}>
      <JsonLd data={ld} />
      <div className="wrap faq">
        <SectionHead label={t.label} title={page.title || t.title} as="h1" />
        {page.intro ? <p className="muted faq-intro">{page.intro}</p> : null}
        {groups.map((g) => (
          <div key={g._key} className="faq-group">
            {groups.length > 1 && g.title ? <h2>{g.title}</h2> : null}
            {g.items.map((i) => (
              <details key={i._key}>
                <summary>{i.question}</summary>
                <div className="faq-a">
                  <Paragraphs text={i.answer} />
                </div>
              </details>
            ))}
          </div>
        ))}
        <p className="faq-more">
          {t.more}{" "}
          <Link className="link" href={href(lang, "contact")}>
            {t.contact}
          </Link>
        </p>
      </div>
    </section>
  );
}
