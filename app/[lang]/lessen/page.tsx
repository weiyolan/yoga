import { Photo } from "@/components/Photo";
import { ClassTiles, Hero, SectionHead } from "@/components/sections";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { href, langParam } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { LESSONS_QUERY } from "@/sanity/queries";

export async function generateMetadata({ params }: PageProps<"/[lang]/lessen">) {
  const lang = await langParam(params);
  const { page } = await sanityFetch({ query: LESSONS_QUERY, lang });
  return buildMetadata({ lang, route: "lessons", seo: page?.seo, fallbackTitle: page?.hero?.title, fallbackImage: page?.hero?.photo });
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
/** Classes starting before 14:00 go in the morning row. */
const isMorning = (time: string | null) => (time ?? "00:00") < "14:00";

export default async function Lessons({ params }: PageProps<"/[lang]/lessen">) {
  const lang = await langParam(params);
  const { page, styles, studios } = await sanityFetch({ query: LESSONS_QUERY, lang });
  const t = getDictionary(lang).lessons;
  const schedule = [...(page?.schedule ?? [])].sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  const rows = [
    [t.morning, schedule.filter((s) => isMorning(s.startTime))],
    [t.evening, schedule.filter((s) => !isMorning(s.startTime))],
  ] as const;

  return (
    <>
      <Hero hero={page?.hero} short />

      <section className="s" id="stijlen" style={{ borderTop: 0 }}>
        <div className="wrap">
          <SectionHead label={t.stylesLabel} title={page?.stylesTitle} />
          {page?.intro ? (
            <p className="muted" style={{ marginTop: -16, marginBottom: 32 }}>
              {page.intro}
            </p>
          ) : null}
          <ClassTiles lang={lang} styles={styles} to={href(lang, "lessons", { hash: "planning" })} />
        </div>
      </section>

      {studios.length ? (
        <section className="s alt" id="studios">
          <div className="wrap">
            <SectionHead label={t.studiosLabel} title={page?.studiosTitle} />
            <div className="g3">
              {studios.map((s) => (
                <div key={s._id}>
                  <Photo media={s.photo} ratio="r32" sizes="(max-width: 860px) 100vw, 33vw" />
                  <h4 style={{ marginTop: 14 }}>{s.name}</h4>
                  {s.address || s.city ? (
                    <p className="muted small" style={{ margin: "6px 0 10px" }}>
                      {[s.address, s.city].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  {s.website ? (
                    <a className="link" href={s.website} target="_blank" rel="noopener">
                      {t.website}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Always rendered: the menu and the style tiles link to #planning. */}
      <section className="s" id="planning">
        <div className="wrap">
          <SectionHead label={t.scheduleLabel} title={page?.scheduleTitle} />
          {schedule.length ? (
            <div className="week-wrap">
              <table className="week">
                <thead>
                  <tr>
                    <th>
                      <span className="visually-hidden">{t.scheduleLabel}</span>
                    </th>
                    {DAYS.map((day) => (
                      <th key={day} scope="col">
                        {t.days[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, slots]) => (
                    <tr key={label}>
                      <th scope="row" className="muted small" style={{ font: "inherit", textTransform: "none", letterSpacing: 0, borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                        {label}
                      </th>
                      {DAYS.map((day) => (
                        <td key={day}>
                          {slots
                            .filter((s) => s.day === day)
                            .map((s) => {
                              const body = (
                                <>
                                  <b>{s.style?.name}</b>
                                  {[s.startTime, s.durationMinutes ? `${s.durationMinutes} min` : null, s.studio?.name].filter(Boolean).join(" · ")}
                                </>
                              );
                              return s.bookingUrl ? (
                                <a key={s._key} className="slot" href={s.bookingUrl} target="_blank" rel="noopener" title={t.book}>
                                  {body}
                                </a>
                              ) : (
                                <span key={s._key} className="slot">
                                  {body}
                                </span>
                              );
                            })}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="schedule-empty">
              <p className="muted">{page?.scheduleEmpty || t.scheduleEmpty}</p>
              <ul className="row" style={{ listStyle: "none", padding: 0 }}>
                {studios.map((s) =>
                  s.website ? (
                    <li key={s._id}>
                      <a className="btn ghost sm" href={s.website} target="_blank" rel="noopener">
                        {s.name}
                      </a>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
