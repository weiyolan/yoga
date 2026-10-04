import { RetreatFilter } from "@/components/RetreatFilter";
import { Hero, RetreatCard, SectionHead } from "@/components/sections";
import { getDictionary } from "@/lib/dictionary";
import { monthYear } from "@/lib/format";
import { buildMetadata } from "@/lib/metadata";
import { langParam } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { RETREATS_QUERY } from "@/sanity/queries";

export async function generateMetadata({ params }: PageProps<"/[lang]/retreats">) {
  const lang = await langParam(params);
  const { page } = await sanityFetch({ query: RETREATS_QUERY, lang });
  return buildMetadata({ lang, route: "retreats", seo: page?.seo, fallbackTitle: page?.hero?.title, fallbackImage: page?.hero?.photo });
}

/** Every month a retreat touches (a retreat from 28 Feb to 3 Mar is in both). */
function months(lang: Parameters<typeof monthYear>[0], start: string | null, end: string | null) {
  if (!start) return [];
  const out: { key: string; label: string }[] = [];
  const d = new Date(`${start.slice(0, 7)}-01T12:00:00Z`);
  const last = (end ?? start).slice(0, 7);
  while (d.toISOString().slice(0, 7) <= last) {
    const key = d.toISOString().slice(0, 7);
    out.push({ key, label: monthYear(lang, `${key}-01`) });
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
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
            <p className="muted">{t.noneUpcoming}</p>
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

      <section className="s" id="zoek">
        <div className="wrap">
          <span className="label">{t.search}</span>
          <RetreatFilter
            lang={lang}
            items={[...upcoming, ...past].map((r, i) => ({
              id: r._id,
              destination: r.country ?? r.place,
              months: months(lang, r.startDate, r.endDate),
              card: <RetreatCard lang={lang} retreat={r} tag={i === 0 && upcoming.length ? d.card.next : undefined} />,
            }))}
          />
        </div>
      </section>
    </>
  );
}
