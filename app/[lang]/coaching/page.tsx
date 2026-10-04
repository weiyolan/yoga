import Link from "next/link";
import { Photo } from "@/components/Photo";
import { Hero } from "@/components/sections";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { href, langParam } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { COACHING_QUERY } from "@/sanity/queries";

export async function generateMetadata({ params }: PageProps<"/[lang]/coaching">) {
  const lang = await langParam(params);
  const page = await sanityFetch({ query: COACHING_QUERY, lang });
  return buildMetadata({ lang, route: "coaching", seo: page?.seo, fallbackTitle: page?.hero?.title, fallbackImage: page?.hero?.photo });
}

export default async function Coaching({ params }: PageProps<"/[lang]/coaching">) {
  const lang = await langParam(params);
  const page = await sanityFetch({ query: COACHING_QUERY, lang });
  const t = getDictionary(lang).coaching;
  return (
    <>
      <Hero hero={page?.hero} short />
      {page?.blocks?.length ? (
        <section className="s" style={{ borderTop: 0 }}>
          <div className="wrap">
            <div className="g3">
              {page.blocks.map((b) => (
                <div key={b._key}>
                  {b.label ? <span className="label">{b.label}</span> : null}
                  {b.title ? <h3>{b.title}</h3> : null}
                  {b.text ? (
                    <p className="muted" style={{ marginTop: 10 }}>
                      {b.text}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <section className="s alt">
        <div className="wrap">
          {page?.photos?.length ? (
            <div className="g2" style={{ gap: 12 }}>
              {page.photos.slice(0, 2).map((m) => (
                <Photo key={m._id} media={m} ratio="r45" sizes="(max-width: 860px) 100vw, 50vw" />
              ))}
            </div>
          ) : null}
          <div className="center" style={{ marginTop: page?.photos?.length ? 48 : 0 }}>
            {page?.ctaTitle ? <h2 style={{ marginBottom: 20 }}>{page.ctaTitle}</h2> : null}
            <Link className="btn" href={href(lang, "contact")}>
              {t.cta}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
