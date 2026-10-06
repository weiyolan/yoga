import { Fragment } from "react";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { ClassTiles, Hero, RetreatCard, SectionHead } from "@/components/sections";
import { Testimonials } from "@/components/Testimonials";
import { getDictionary } from "@/lib/dictionary";
import { dateRange, euro, join } from "@/lib/format";
import { buildMetadata } from "@/lib/metadata";
import { href, langParam, retreatHref } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { HOME_QUERY, LAYOUT_QUERY } from "@/sanity/queries";

export async function generateMetadata({ params }: PageProps<"/[lang]">) {
  const lang = await langParam(params);
  const page = await sanityFetch({ query: HOME_QUERY, lang });
  return buildMetadata({ lang, route: "home", seo: page?.seo, fallbackImage: page?.hero?.photo });
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const lang = await langParam(params);
  const [page, layout] = await Promise.all([sanityFetch({ query: HOME_QUERY, lang }), sanityFetch({ query: LAYOUT_QUERY, lang })]);
  const d = getDictionary(lang);
  const t = d.home;
  const f = page?.featuredRetreat;
  const cards = [...(page?.upcomingRetreats ?? []), ...(page?.pastRetreats ?? [])].slice(0, 3);
  const handle = layout?.instagram?.match(/instagram\.com\/([^/?#]+)/)?.[1];

  return (
    <>
      <Hero
        hero={page?.hero}
        actions={
          <>
            <Link className="btn white" href={href(lang, "retreats")}>
              {t.discover}
            </Link>
            <Link className="btn light" href={href(lang, "lessons")}>
              {t.lessons}
            </Link>
          </>
        }
      />

      {f ? (
        <section className="s" style={{ borderTop: 0 }}>
          <div className="wrap">
            <div className="g2">
              <Link href={retreatHref(lang, f.slug)} style={{ display: "block" }} tabIndex={-1} aria-hidden="true">
                <Photo media={f.cardPhoto} ratio="r32" sizes="(max-width: 860px) 100vw, 50vw" />
              </Link>
              <div>
                <span className="label">{d.card.next}</span>
                <h2>{f.title}</h2>
                <p className="muted" style={{ marginTop: 12 }}>
                  {[dateRange(lang, f.startDate, f.endDate), join(f.place, f.country), f.capacity ? `${d.card.max} ${f.capacity} ${d.card.participants}` : null, f.priceFrom ? `${d.card.from} ${euro(lang, f.priceFrom)}` : null].filter(Boolean).join(" · ")}
                </p>
                {f.teaser ? <p>{f.teaser}</p> : null}
                <div className="row" style={{ marginTop: 22 }}>
                  <Link className="btn" href={retreatHref(lang, f.slug)}>
                    {t.discoverRetreat}
                  </Link>
                  <Link className="link" href={href(lang, "retreats")}>
                    {t.allRetreats}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="s alt">
        <div className="wrap center">
          <span className="label">{t.whoWeAre}</span>
          {page?.introTitle ? <h2 style={{ maxWidth: "20ch", margin: "0 auto 20px" }}>{page.introTitle}</h2> : null}
          {page?.intro ? <p className="muted">{page.intro}</p> : null}
          <Link className="link" href={href(lang, "about")}>
            {t.meet}
          </Link>
        </div>
      </section>

      {cards.length ? (
        <section className="s">
          <div className="wrap">
            <SectionHead label={t.retreatsLabel} title={t.retreatsTitle}>
              <Link className="link" href={href(lang, "retreats")}>
                {t.allRetreats}
              </Link>
            </SectionHead>
            <div className="g3">
              {cards.map((r, i) => (
                <RetreatCard key={r._id} lang={lang} retreat={r} tag={i === 0 && page?.upcomingRetreats?.[0]?._id === r._id ? d.card.next : undefined} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {page?.styles?.length ? (
        <section className="s alt">
          <div className="wrap">
            <SectionHead label={t.lessonsLabel} title={t.lessonsTitle}>
              <Link className="link" href={href(lang, "lessons", { hash: "planning" })}>
                {t.lessonsLink}
              </Link>
            </SectionHead>
            <ClassTiles lang={lang} styles={page.styles} to={href(lang, "lessons", { hash: "stijlen" })} />
            {page.studios?.length ? (
              <p className="muted small" style={{ marginTop: 18 }}>
                {page.studios.map((s, i) => (
                  <Fragment key={s._id}>
                    {i ? " · " : null}
                    {s.website ? (
                      <a href={s.website} target="_blank" rel="noopener">
                        {s.name}
                      </a>
                    ) : (
                      s.name
                    )}
                  </Fragment>
                ))}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {page?.testimonials?.length ? (
        <section className="s">
          <div className="wrap">
            <Testimonials items={page.testimonials} label={t.testimonials} itemLabel={t.testimonialN} />
          </div>
        </section>
      ) : null}

      <section className="s alt">
        <div className="wrap">
          <div className="g2">
            <div>
              <span className="label">{t.whoWeAre}</span>
              {page?.aboutTitle ? <h2>{page.aboutTitle}</h2> : null}
              {page?.aboutText ? <p style={{ marginTop: 14 }}>{page.aboutText}</p> : null}
              <Link className="link" href={href(lang, "about")}>
                {t.aboutLink}
              </Link>
            </div>
            <Photo media={page?.aboutPhoto} ratio="r32" sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      {page?.instagram?.length ? (
        <section className="s">
          <div className="wrap">
            <SectionHead label={t.follow} title={handle ? `@${handle}` : "Instagram"}>
              <div className="row">
                {layout?.instagram ? (
                  <a className="link" href={layout.instagram} target="_blank" rel="noopener">
                    Instagram
                  </a>
                ) : null}
                {layout?.facebook ? (
                  <a className="link" href={layout.facebook} target="_blank" rel="noopener">
                    Facebook
                  </a>
                ) : null}
              </div>
            </SectionHead>
            <div className="g6">
              {page.instagram.map((m) =>
                layout?.instagram ? (
                  <a key={m._id} href={layout.instagram} target="_blank" rel="noopener" aria-label={`Instagram: ${m.alt || m.title || ""}`}>
                    <Photo media={m} ratio="r1" sizes="(max-width: 860px) 33vw, 16vw" />
                  </a>
                ) : (
                  <Photo key={m._id} media={m} ratio="r1" sizes="(max-width: 860px) 33vw, 16vw" />
                ),
              )}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
