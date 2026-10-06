import Link from "next/link";
import { notFound } from "next/navigation";
import { Lightbox, LightboxTrigger, type LightboxItem } from "@/components/Lightbox";
import { fullSrc, Photo } from "@/components/Photo";
import { Paragraphs } from "@/components/RichText";
import { Hero } from "@/components/sections";
import { getDictionary } from "@/lib/dictionary";
import { dateRange, euro, join } from "@/lib/format";
import { buildMetadata } from "@/lib/metadata";
import { href, langParam } from "@/lib/routes";
import { isUpcoming, sanityFetch } from "@/sanity/fetch";
import type { Media } from "@/sanity/image";
import { RETREAT_BY_SLUG_QUERY, RETREAT_SLUGS_QUERY } from "@/sanity/queries";

/** Known retreats are prerendered; a new one renders on its first visit and is cached from then on. */
export async function generateStaticParams() {
  const slugs = await sanityFetch({ query: RETREAT_SLUGS_QUERY });
  return slugs.filter(Boolean).map((slug) => ({ slug: slug! }));
}

async function load(params: PageProps<"/[lang]/retreats/[slug]">["params"]) {
  const lang = await langParam(params);
  const { slug } = await params;
  const retreat = await sanityFetch({ query: RETREAT_BY_SLUG_QUERY, params: { slug }, lang });
  return { lang, slug, retreat };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/retreats/[slug]">) {
  const { lang, slug, retreat } = await load(params);
  if (!retreat) return {};
  return buildMetadata({ lang, route: "retreats", slug, seo: retreat.seo, fallbackTitle: retreat.title, fallbackImage: retreat.hero?.photo ?? retreat.cardPhoto });
}

const clean = (xs: string[] | null | undefined) => (xs ?? []).map((x) => x.trim()).filter(Boolean);
/** "Rita, Philippe & Michèle" */
const names = (xs: (string | null)[] | null | undefined) => {
  const n = (xs ?? []).filter(Boolean);
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} & ${n.at(-1)}` : n[0];
};

export default async function RetreatPage({ params }: PageProps<"/[lang]/retreats/[slug]">) {
  const { lang, retreat: r } = await load(params);
  if (!r) notFound();
  const d = getDictionary(lang);
  const t = d.retreat;
  const upcoming = isUpcoming(r.endDate);
  const when = dateRange(lang, r.startDate, r.endDate);
  const where = join(r.place, r.country);
  const group = r.capacity ? `${d.card.max} ${r.capacity}` : null;
  const highlights = clean(r.highlights);
  const included = clean(r.included);
  const notIncluded = clean(r.notIncluded);
  const signup = upcoming ? r.signupUrl : null;

  if (!upcoming) {
    // Past retreat: a look back — photos, the nutshell and the facts; no booking box.
    const recap = (r.recapPhotos?.length ? r.recapPhotos : [...(r.moodPhotos ?? []), ...(r.placePhotos ?? [])]) as Media[];
    const lb: LightboxItem[] = recap.map((m) => ({ src: fullSrc(m) ?? "", alt: m.alt, caption: m.title }));
    const price = r.priceFrom ?? Math.min(...(r.prices ?? []).map((p) => p.amount ?? Infinity));
    const facts = [
      [t.where, join(where, r.venue)],
      [t.hosts, names(r.hosts?.map((p) => p.name))],
      [t.price, Number.isFinite(price) ? `${t.from} ${euro(lang, price)}` : null],
      [t.participants, r.participantCount ?? (r.capacity ? `${d.card.max} ${r.capacity}` : null)],
    ].filter(([, v]) => v);
    return (
      <Lightbox lang={lang} items={lb}>
        <Hero
          hero={r.hero}
          title={r.title}
          subtitle={null}
          meta={
            <>
              {when ? <span>{when}</span> : null}
              {where ? <span>{where}</span> : null}
            </>
          }
        />

        <section className="s" style={{ borderTop: 0, paddingTop: 24 }}>
          <div className="wrap recap">
            <div>
              <span className="label">{t.nutshell}</span>
              {r.nutshellTitle ? <h2>{r.nutshellTitle}</h2> : null}
              <Paragraphs text={r.nutshellText} />
              {highlights.length ? (
                <ul className="ticks">
                  {highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            {facts.length ? (
              <dl className="facts">
                {facts.map(([k, v]) => (
                  <div key={String(k)}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </section>

        {recap.length ? (
          <section className="s alt">
            <div className="wrap">
              <span className="label">{t.recap}</span>
              <h2>{t.recapPhotos}</h2>
              <div className="mosaic" style={{ marginTop: 28 }}>
                {recap.map((m, i) => (
                  <figure key={`${m._id}-${i}`} className={["w2 h2", "", "", "w2", "", "h2", "", ""][i % 8] || undefined}>
                    <LightboxTrigger index={i} label={`${t.photos}: ${m.alt || m.title || i + 1}`}>
                      <Photo media={m} sizes="(max-width: 700px) 50vw, 25vw" style={{ height: "100%" }} />
                    </LightboxTrigger>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="s center">
          <div className="wrap">
            <h2 style={{ margin: "0 auto 22px", maxWidth: "20ch" }}>{t.nextTitle}</h2>
            <div className="row" style={{ justifyContent: "center" }}>
              <Link className="btn" href={href(lang, "retreats", { hash: "komend" })}>
                {t.otherRetreats}
              </Link>
              <Link className="btn ghost" href={href(lang, "contact")}>
                {t.ask}
              </Link>
            </div>
          </div>
        </section>
      </Lightbox>
    );
  }

  // One lightbox for every photo on the page (mood grid + the place).
  const mood = (r.moodPhotos ?? []).slice(0, 4);
  const place = (r.placePhotos ?? []).slice(0, 2);
  const all = [...mood, ...place] as Media[];
  const items: LightboxItem[] = all.map((m) => ({ src: fullSrc(m) ?? "", alt: m.alt, caption: m.title }));
  const thumb = (m: Media | undefined, i: number, sizes: string, ratio?: "r32", style?: React.CSSProperties) =>
    m ? (
      <LightboxTrigger index={i} label={`${t.photos}: ${m.alt || m.title || i + 1}`} style={style}>
        <Photo media={m} ratio={ratio} sizes={sizes} style={ratio ? undefined : { height: "100%" }} />
      </LightboxTrigger>
    ) : (
      <div className="ph" style={style} />
    );

  const toc = [
    ["notendop", t.toc.nutshell, r.nutshellTitle || r.nutshellText || highlights.length],
    ["plek", t.toc.place, r.placeTitle || r.placeText],
    ["mensen", t.toc.people, r.hosts?.length],
    ["programma", t.toc.programme, r.programme?.length],
    ["praktisch", t.toc.practical, r.prices?.length || included.length || notIncluded.length],
  ] as const;

  return (
    <Lightbox lang={lang} items={items}>
      <Hero
        hero={r.hero}
        title={r.title}
        subtitle={null}
        meta={
          <>
            {when ? <span>{when}</span> : null}
            {where ? <span>{where}</span> : null}
            {r.capacity ? <span>{`${d.card.max} ${r.capacity} ${d.card.participants}`}</span> : null}
            {r.priceFrom && upcoming ? <span>{`${d.card.from} ${euro(lang, r.priceFrom)}`}</span> : null}
          </>
        }
        actions={
          signup ? (
            <a className="btn white" href="#inschrijven">
              {t.signup}
            </a>
          ) : null
        }
      />

      {mood.length ? (
        <section className="s" style={{ borderTop: 0, paddingTop: 24 }}>
          <div className="wrap">
            <div className="mood">
              {thumb(mood[0], 0, "(max-width: 860px) 100vw, 66vw", undefined, { minHeight: 420 })}
              <div className="side">
                {thumb(mood[1], 1, "(max-width: 860px) 100vw, 33vw")}
                {mood.length > 3 ? (
                  <div className="duo">
                    {thumb(mood[2], 2, "(max-width: 860px) 50vw, 17vw")}
                    {thumb(mood[3], 3, "(max-width: 860px) 50vw, 17vw")}
                  </div>
                ) : (
                  thumb(mood[2], 2, "(max-width: 860px) 100vw, 33vw")
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="s" style={{ paddingTop: 40, borderTop: mood.length ? undefined : 0 }}>
        <div className="wrap detail">
          <div>
            {toc[0][2] ? (
              <div className="block" id="notendop">
                <span className="label">{t.nutshell}</span>
                {r.nutshellTitle ? <h2>{r.nutshellTitle}</h2> : null}
                <Paragraphs text={r.nutshellText} />
                {highlights.length ? (
                  <ul className="ticks">
                    {highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {toc[1][2] ? (
              <div className="block" id="plek">
                <span className="label">{t.place}</span>
                {r.placeTitle ? <h2>{r.placeTitle}</h2> : null}
                <Paragraphs text={r.placeText} />
                {place.length ? (
                  <div className="g2" style={{ gap: 10, marginTop: 22 }}>
                    {place.map((m, i) => (
                      <div key={m._id}>{thumb(m as Media, mood.length + i, "(max-width: 860px) 100vw, 30vw", "r32")}</div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {r.hosts?.length ? (
              <div className="block" id="mensen">
                <span className="label">{t.people}</span>
                <h2>{t.peopleTitle}</h2>
                <div className="people">
                  {r.hosts.map((p) => (
                    <div key={p._id}>
                      <Photo media={p.portrait} ratio="r45" sizes="(max-width: 700px) 50vw, 220px" />
                      <b>{p.name}</b>
                      {p.role ? <span className="muted small">{p.role}</span> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {r.programme?.length ? (
              <div className="block" id="programma">
                <span className="label">{t.programme}</span>
                <h2>{t.programmeTitle}</h2>
                <ul className="ticks">
                  {r.programme.map((p) => (
                    <li key={p._key}>
                      {p.title ? <b>{p.title}</b> : null}
                      {p.title && p.text ? ": " : null}
                      {p.text}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {toc[4][2] ? (
              <div className="block" id="praktisch">
                <span className="label">{t.practical}</span>
                <h2>{t.practicalTitle}</h2>
                <div className="inc">
                  {r.prices?.length || group ? (
                    <div>
                      <h4>{t.price}</h4>
                      <ul className="ticks">
                        {(r.prices ?? []).map((p) => (
                          <li key={p._key}>{[euro(lang, p.amount), p.label].filter(Boolean).join(" ")}</li>
                        ))}
                        {r.capacity ? <li>{`${d.card.max} ${r.capacity} ${d.card.participants}`}</li> : null}
                      </ul>
                    </div>
                  ) : null}
                  {included.length ? (
                    <div>
                      <h4>{t.included}</h4>
                      <ul className="ticks">
                        {included.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {notIncluded.length ? (
                    <div>
                      <h4>{t.notIncluded}</h4>
                      <ul className="ticks">
                        {notIncluded.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <aside>
            {r.priceFrom && upcoming ? (
              <>
                <span className="label">{t.from}</span>
                <div className="price">{euro(lang, r.priceFrom)}</div>
              </>
            ) : null}
            {!upcoming ? <p className="muted">{t.past}</p> : null}
            <dl>
              {when ? (
                <>
                  <dt>{t.when}</dt>
                  <dd>{when}</dd>
                </>
              ) : null}
              {where ? (
                <>
                  <dt>{t.where}</dt>
                  <dd>{where}</dd>
                </>
              ) : null}
              {group ? (
                <>
                  <dt>{t.group}</dt>
                  <dd>{group}</dd>
                </>
              ) : null}
              {r.venue ? (
                <>
                  <dt>{t.stay}</dt>
                  <dd>{r.venue}</dd>
                </>
              ) : null}
            </dl>
            {signup ? (
              <a className="btn" href="#inschrijven" style={{ width: "100%", justifyContent: "center" }}>
                {t.signup}
              </a>
            ) : (
              <Link className="btn ghost" href={href(lang, "retreats", { hash: "komend" })} style={{ width: "100%", justifyContent: "center" }}>
                {t.otherRetreats}
              </Link>
            )}
            <ul>
              {toc
                .filter(([, , show]) => show)
                .map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`}>{label}</a>
                  </li>
                ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="hero short" id="inschrijven" style={{ height: "70vh" }}>
        <Photo media={r.closingPhoto} className="dark" sizes="100vw" />
        <div className="txt center" style={{ left: 0, right: 0, bottom: "auto", top: "50%", transform: "translateY(-50%)" }}>
          {r.closingTitle ? <h1 style={{ margin: "0 auto", maxWidth: "14ch" }}>{r.closingTitle}</h1> : null}
          {r.closingText ? <p style={{ margin: "16px auto 24px" }}>{r.closingText}</p> : null}
          <div className="row" style={{ justifyContent: "center" }}>
            {signup ? (
              <a className="btn white" href={signup} target="_blank" rel="noopener">
                {t.signup}
              </a>
            ) : null}
            <Link className="btn light" href={href(lang, "contact")}>
              {t.ask}
            </Link>
          </div>
        </div>
      </section>
    </Lightbox>
  );
}
