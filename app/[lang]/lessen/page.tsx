import Link from "next/link";
import { Photo } from "@/components/Photo";
import { Paragraphs } from "@/components/RichText";
import { ClassTiles, Hero, SectionHead } from "@/components/sections";
import { getDictionary } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/metadata";
import { href, langParam } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { LESSONS_QUERY } from "@/sanity/queries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/lessen">) {
  const lang = await langParam(params);
  const { page } = await sanityFetch({ query: LESSONS_QUERY, lang });
  return buildMetadata({
    lang,
    route: "lessons",
    seo: page?.seo,
    fallbackTitle: page?.hero?.title,
    fallbackImage: page?.hero?.photo,
  });
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
/** Classes starting before 14:00 go in the morning row. */
const isMorning = (time: string | null) => (time ?? "00:00") < "14:00";

export default async function Lessons({ params }: PageProps<"/[lang]/lessen">) {
  const lang = await langParam(params);
  const { page, styles, studios } = await sanityFetch({
    query: LESSONS_QUERY,
    lang,
  });
  const t = getDictionary(lang).lessons;
  const schedule = [...(page?.schedule ?? [])].sort((a, b) =>
    (a.startTime ?? "").localeCompare(b.startTime ?? ""),
  );
  const rows = [
    [t.morning, schedule.filter((s) => isMorning(s.startTime))],
    [t.evening, schedule.filter((s) => !isMorning(s.startTime))],
  ] as const;
  /** Sections after the tiles (which are .alt) alternate: style 1 light, style 2 .alt, …, then Studio's and Privéles. */
  const alt = (n: number) => n % 2 === 1;

  return (
    <>
      <Hero hero={page?.hero} short />

      {/* Always rendered: the menu and the style tiles link to #planning. */}
      <section className="s" id="planning" style={{ borderTop: 0 }}>
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
                      <th
                        scope="row"
                        className="muted small"
                        style={{
                          font: "inherit",
                          textTransform: "none",
                          letterSpacing: 0,
                          borderBottom: "1px solid var(--line)",
                          verticalAlign: "top",
                        }}
                      >
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
                                  {[
                                    s.startTime,
                                    s.durationMinutes
                                      ? `${s.durationMinutes} min`
                                      : null,
                                    s.studio?.name,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                  <span className={`level ${s.level}`}>
                                    {t.levels[s.level] ?? t.levels.all}
                                  </span>
                                </>
                              );
                              return s.bookingUrl ? (
                                <a
                                  key={s._key}
                                  className="slot"
                                  href={s.bookingUrl}
                                  target="_blank"
                                  rel="noopener"
                                  title={t.book}
                                >
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
                      <a
                        className="btn ghost sm"
                        href={s.website}
                        target="_blank"
                        rel="noopener"
                      >
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
      <section className="s alt" id="stijlen">
        <div className="wrap">
          <SectionHead label={t.stylesLabel} title={page?.stylesTitle} />
          {page?.intro ? (
            <p className="muted" style={{ marginTop: -16, marginBottom: 32 }}>
              {page.intro}
            </p>
          ) : null}
          <ClassTiles
            lang={lang}
            styles={styles}
            to={(s) => `#${s.slug ?? "planning"}`}
          />
        </div>
      </section>

      {/* One section per style (the menu and the tiles link to #<slug>). */}
      {styles.map((s, i) => {
        const when = [
          ...new Set(
            schedule
              .filter((x) => x.style?.slug === s.slug)
              .sort(
                (a, b) =>
                  DAYS.indexOf(a.day as (typeof DAYS)[number]) -
                  DAYS.indexOf(b.day as (typeof DAYS)[number]),
              )
              .map((x) =>
                `${t.days[x.day as (typeof DAYS)[number]] ?? ""} ${x.startTime ?? ""}`.trim(),
              ),
          ),
        ];
        const facts = [
          [t.forWhom, s.forWhom],
          [t.level, s.level],
          [t.where, s.studios?.filter(Boolean).join(" · ")],
          [t.when, when.join(" · ")],
          [t.bring, s.bring],
        ].filter(([, v]) => v) as [string, string][];
        const expect = (s.expect ?? []).filter(Boolean);
        const benefits = (s.benefits ?? []).filter(Boolean);
        return (
          <section
            key={s._id}
            className={`s${alt(i) ? " alt" : ""}`}
            id={s.slug ?? undefined}
          >
            <div className={`wrap style-row${i % 2 ? " rev" : ""}`}>
              <div className="style-photo">
                <Photo
                  media={s.photo2 ?? s.photo}
                  ratio="r45"
                  sizes="(max-width: 860px) 100vw, 45vw"
                />
              </div>
              <div>
                <span className="label">{t.styleN(i + 1, styles.length)}</span>
                <h2>{s.name}</h2>
                {s.tagline ? (
                  <p className="style-tagline">{s.tagline}</p>
                ) : null}
                <Paragraphs text={s.body || s.what} />
                {expect.length || benefits.length ? (
                  <div className="style-lists">
                    {expect.length ? (
                      <div>
                        <h3>{t.expect}</h3>
                        <ul className="ticks">
                          {expect.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {benefits.length ? (
                      <div>
                        <h3>{t.benefits}</h3>
                        <ul className="ticks">
                          {benefits.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {facts.length ? (
                  <dl className="facts sm">
                    {facts.map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                <a
                  className="link"
                  href="#planning"
                  style={{ display: "inline-block", marginTop: 26 }}
                >
                  {t.toSchedule}
                </a>
              </div>
            </div>
          </section>
        );
      })}

      {studios.length ? (
        <section
          className={`s${alt(styles.length) ? " alt" : ""}`}
          id="studios"
        >
          <div className="wrap">
            <SectionHead label={t.studiosLabel} title={page?.studiosTitle} />
            <div className="g3">
              {studios.map((s) => (
                <div key={s._id}>
                  <Photo
                    media={s.photo}
                    ratio="r32"
                    sizes="(max-width: 860px) 100vw, 33vw"
                  />
                  <h4 style={{ marginTop: 14 }}>{s.name}</h4>
                  {s.address || s.city ? (
                    <p className="muted small" style={{ margin: "6px 0 10px" }}>
                      {[s.address, s.city].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  {s.website ? (
                    <a
                      className="link"
                      href={s.website}
                      target="_blank"
                      rel="noopener"
                    >
                      {t.website}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {page?.private?.title || page?.private?.text ? (
        // Privéles (the old Coaching page, in short): one row like the Home "who are we" block.
        <section
          className={`s${alt(styles.length + (studios.length ? 1 : 0)) ? " alt" : ""}`}
          id="prive"
        >
          <div className="wrap">
            <div className="g2">
              <div>
                <span className="label">{t.privateLabel}</span>
                <h2>{page.private.title || t.privateTitle}</h2>
                {page.private.text ? (
                  <p style={{ marginTop: 14 }}>{page.private.text}</p>
                ) : null}
                {page.private.practical ? (
                  <p className="muted small">{page.private.practical}</p>
                ) : null}
                <Link
                  className="btn"
                  href={href(lang, "contact")}
                  style={{ marginTop: 18 }}
                >
                  {page.private.button || t.privateButton}
                </Link>
              </div>
              <Photo
                media={page.private.photo}
                ratio="r32"
                sizes="(max-width: 860px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
