import { Hero, RetreatCard, SectionHead } from "@/components/sections";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { langParam } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { RETREATS_QUERY } from "@/sanity/queries";

export async function generateMetadata({ params }: PageProps<"/[lang]/retreats">) {
  const lang = await langParam(params);
  const { page } = await sanityFetch({ query: RETREATS_QUERY, lang });
  return buildMetadata({ lang, route: "retreats", seo: page?.seo, fallbackTitle: page?.hero?.title, fallbackDescription: page?.hero?.subtitle, fallbackImage: page?.hero?.photo });
}

export default async function Retreats({ params }: PageProps<"/[lang]/retreats">) {
  const lang = await langParam(params);
  const { page, upcoming, past } = await sanityFetch({ query: RETREATS_QUERY, lang });
  const d = getDictionary(lang);
  const t = d.retreats;

  return (
    <>
      <Hero hero={page?.hero} short />

      <section className="s" id="komend" style={{ borderTop: 0 }}>
        <div className="wrap">
          <SectionHead label={t.upcoming} title={page?.upcomingTitle} />
          {upcoming.length ? (
            <div className="g3">
              {upcoming.map((r, i) => (
                <RetreatCard key={r._id} lang={lang} retreat={r} tag={i === 0 ? d.card.next : undefined} />
              ))}
            </div>
          ) : (
            <p className="muted">{page?.noneUpcoming || t.noneUpcoming}</p>
          )}
        </div>
      </section>

      {past.length ? (
        <section className="s alt" id="voorbij">
          <div className="wrap">
            <SectionHead label={t.past} title={page?.pastTitle} />
            <div className="g3">
              {past.map((r) => (
                <RetreatCard key={r._id} lang={lang} retreat={r} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

    </>
  );
}
