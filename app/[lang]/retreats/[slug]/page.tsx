import Link from "next/link";
import { notFound } from "next/navigation";
import { HashRedirect } from "@/components/HashRedirect";
import { Lightbox, LightboxTrigger, type LightboxItem } from "@/components/Lightbox";
import { fullSrc, Photo } from "@/components/Photo";
import { Paragraphs } from "@/components/RichText";
import { Hero, ReviewList } from "@/components/sections";
import { Toc } from "@/components/Toc";
import { getDictionary } from "@/lib/dictionary";
import { dateRange, euro, join, placesLabel, spotsLeft } from "@/lib/format";
import { buildMetadata } from "@/lib/metadata";
import { href, langParam, reviewHref, signupHref } from "@/lib/routes";
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
  const group = placesLabel(lang, r);
  const highlights = clean(r.highlights);
  const included = clean(r.included);
  const notIncluded = clean(r.notIncluded);
  // Sign-up: an external link (Studio override) or our own sign-up page; full → the same page as waiting list.
  const external = r.signupUrl;
  const full = spotsLeft(r) === 0;
  const signupTo = external || signupHref(lang, r.slug);
  const signupLabel = full && !external ? t.waitlist : t.signup;
  const signupLink = (className: string, style?: React.CSSProperties) =>
    external ? (
      <a className={className} href={external} target="_blank" rel="noopener" style={style}>
        {signupLabel}
      </a>
    ) : (
      <Link className={className} href={signupTo} style={style}>
        {signupLabel}
      </Link>
    );

  if (!upcoming) {
    // Past retreat: a look back — photos, the nutshell and the facts; no booking box.
    const recap = (r.recapPhotos?.length ? r.recapPhotos : [...(r.moodPhotos ?? []), ...(r.placePhotos ?? [])]) as Media[];
    const lb: LightboxItem[] = recap.map((m) => ({ src: fullSrc(m) ?? "", alt: m.alt }));
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
          title={r.hero?.title || r.title}
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
              <h2>{r.labels?.recapTitle || t.recapPhotos}</h2>
              <div className="mosaic" style={{ marginTop: 28 }}>
                {recap.map((m, i) => (
                  <figure key={`${m._id}-${i}`} className={["w2 h2", "", "", "w2", "", "h2", "", ""][i % 8] || undefined}>
                    <LightboxTrigger index={i} label={`${t.photos}: ${m.alt || i + 1}`}>
                      <Photo media={m} sizes="(max-width: 700px) 50vw, 25vw" style={{ height: "100%" }} />
                    </LightboxTrigger>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {r.reviews?.length ? (
          <section className="s" id="reviews">
            <div className="wrap">
              <span className="label">{d.review.label}</span>
              <h2>{d.review.title}</h2>
              <ReviewList lang={lang} reviews={r.reviews} />
            </div>
          </section>
        ) : null}

        <section className="s center">
          <div className="wrap">
            <h2 style={{ margin: "0 auto 22px", maxWidth: "20ch" }}>{r.labels?.pastCtaTitle || t.nextTitle}</h2>
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
        {/* Old review links (…#review) → the review page. */}
        <HashRedirect hash="review" to={reviewHref(lang, r.slug)} />
      </Lightbox>
    );
  }

  // One lightbox for every photo on the page (mood grid + the place).
  const mood = (r.moodPhotos ?? []).slice(0, 4);
  const place = (r.placePhotos ?? []).slice(0, 2);
  const all = [...mood, ...place] as Media[];
  const items: LightboxItem[] = all.map((m) => ({ src: fullSrc(m) ?? "", alt: m.alt }));
  const thumb = (m: Media | undefined, i: number, sizes: string, ratio?: "r32", style?: React.CSSProperties) =>
    m ? (
      <LightboxTrigger index={i} label={`${t.photos}: ${m.alt || i + 1}`} style={style}>
        <Photo media={m} ratio={ratio} sizes={sizes} style={ratio ? undefined : { height: "100%" }} />
      </LightboxTrigger>
    ) : (
      <div className="ph" style={style} />
    );

  // its own reviews (once there are), else those of earlier editions
  const reviews = r.reviews?.length ? r.reviews : (r.earlierReviews ?? []);
  const toc = [
    ["notendop", t.toc.nutshell, r.nutshellTitle || r.nutshellText || highlights.length],
    ["plek", t.toc.place, r.placeTitle || r.placeText],
    ["mensen", t.toc.people, r.hosts?.length],
    ["programma", t.toc.programme, r.programme?.length],
    ["praktisch", t.toc.practical, r.prices?.length || included.length || notIncluded.length],
    ["reviews", t.toc.reviews, reviews.length],
  ] as const;

  return (
    <Lightbox lang={lang} items={items}>
      <Hero
        hero={r.hero}
        title={r.hero?.title || r.title}
        meta={
          <>
            {when ? <span>{when}</span> : null}
            {where ? <span>{where}</span> : null}
            {group ? <span>{group}</span> : null}
            {r.priceFrom ? <span>{`${d.card.from} ${euro(lang, r.priceFrom)}`}</span> : null}
          </>
        }
        actions={signupLink("btn white")}
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
                <h2>{r.labels?.peopleTitle || t.peopleTitle}</h2>
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
                <h2>{r.labels?.programmeTitle || t.programmeTitle}</h2>
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
                <h2>{r.labels?.practicalTitle || t.practicalTitle}</h2>
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
            {r.priceFrom ? (
              <>
                <span className="label">{t.from}</span>
                <div className="price">{euro(lang, r.priceFrom)}</div>
              </>
            ) : null}
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
              {r.hosts?.length ? (
                <>
                  <dt>{t.hosts}</dt>
                  <dd>{names(r.hosts.map((p) => p.name))}</dd>
                </>
              ) : null}
            </dl>
            {signupLink("btn", { width: "100%", justifyContent: "center" })}
            <Toc label={t.toc.title} items={toc.filter(([, , show]) => show).map(([id, label]) => [id, label])} />
          </aside>
        </div>
      </section>

      {reviews.length ? (
        <section className="s alt" id="reviews">
          <div className="wrap">
            <span className="label">{d.review.label}</span>
            <h2>{r.reviews?.length ? d.review.title : t.earlierReviews}</h2>
            <ReviewList lang={lang} reviews={reviews} context={!r.reviews?.length} />
          </div>
        </section>
      ) : null}

      {/* Closing photo + the sign-up button. Keeps the old #inschrijven anchor: it now forwards to the sign-up page. */}
      <section className="hero short" id="inschrijven" style={{ height: "70vh" }}>
        <Photo media={r.closingPhoto ?? r.hero?.photo} className="dark" sizes="100vw" />
        <div className="txt center" style={{ left: 0, right: 0, bottom: "auto", top: "50%", transform: "translateY(-50%)" }}>
          <h1 style={{ margin: "0 auto", maxWidth: "14ch" }}>{r.closingTitle || r.title}</h1>
          {r.closingText ? <p style={{ margin: "16px auto 24px" }}>{r.closingText}</p> : null}
          <div className="row" style={{ justifyContent: "center", marginTop: r.closingText ? 0 : 24 }}>
            {signupLink("btn white")}
            <Link className="btn light" href={href(lang, "contact")}>
              {t.ask}
            </Link>
          </div>
        </div>
      </section>
      {external ? null : <HashRedirect hash="inschrijven" to={signupTo} />}
    </Lightbox>
  );
}
