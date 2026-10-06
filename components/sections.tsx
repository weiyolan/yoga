/** Shared server-rendered building blocks (wireframe: hero(), card(), tiles()). */
import Link from "next/link";
import type { ReactNode } from "react";
import { getDictionary } from "@/lib/dictionary";
import { dateRange, euro } from "@/lib/format";
import { retreatHref } from "@/lib/routes";
import { isUpcoming } from "@/sanity/fetch";
import type { Lang } from "@/sanity/site.config";
import type { HOME_QUERY_RESULT, LESSONS_QUERY_RESULT, RETREATS_QUERY_RESULT } from "@/sanity/types";
import { Photo, SanityImg } from "./Photo";

export type RetreatCardData = RETREATS_QUERY_RESULT["upcoming"][number];
export type StyleData = LESSONS_QUERY_RESULT["styles"][number];
export type HeroData = NonNullable<NonNullable<HOME_QUERY_RESULT>["hero"]>;

/** A direct video file (mp4/webm) can loop silently; Vimeo gets its background player. */
function HeroVideo({ url, poster }: { url: string; poster?: string }) {
  if (/\.(mp4|webm)(\?|$)/i.test(url)) return <video src={url} poster={poster} autoPlay muted loop playsInline aria-hidden="true" />;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
  if (vimeo)
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeo}?background=1&autoplay=1&loop=1&muted=1&dnt=1`}
        title=""
        aria-hidden="true"
        tabIndex={-1}
        allow="autoplay; fullscreen"
        className="hero-iframe"
      />
    );
  return null;
}

/** Every page opens with one big photo (or a silent loop on Home). */
export function Hero({ hero, short, meta, actions, title, subtitle, priority = true }: { hero: HeroData | null | undefined; short?: boolean; meta?: ReactNode; actions?: ReactNode; title?: string | null; subtitle?: string | null; priority?: boolean }) {
  const h1 = title ?? hero?.title;
  const sub = subtitle ?? hero?.subtitle;
  return (
    <>
      <section className={`hero${short ? " short" : ""}`}>
        <div className="ph dark">
          <SanityImg media={hero?.photo} priority={priority} />
          {hero?.videoUrl ? <HeroVideo url={hero.videoUrl} poster={hero.photo?.image?.asset?.url ?? undefined} /> : null}
        </div>
        <div className="txt">
          {h1 ? <h1>{h1}</h1> : null}
          {meta ? <div className="meta">{meta}</div> : null}
          {sub ? <p>{sub}</p> : null}
          {actions ? <div className="row">{actions}</div> : null}
        </div>
      </section>
      <div className="guide" aria-hidden="true" />
    </>
  );
}

export function SectionHead({ label, title, as: H = "h2", children }: { label?: string | null; title?: string | null; as?: "h1" | "h2"; children?: ReactNode }) {
  return (
    <div className="head">
      <div>
        {label ? <span className="label">{label}</span> : null}
        {title ? <H style={H === "h1" ? { fontSize: "clamp(2.4rem,5vw,4.2rem)" } : undefined}>{title}</H> : null}
      </div>
      {children}
    </div>
  );
}

/** Retreat card: upcoming in colour, past in black & white (colour on hover). */
export function RetreatCard({ lang, retreat, tag }: { lang: Lang; retreat: RetreatCardData; tag?: string }) {
  const t = getDictionary(lang).card;
  const past = !isUpcoming(retreat.endDate);
  const extra = past ? (retreat.participantCount ? `${retreat.participantCount} ${t.participants}` : "") : retreat.priceFrom ? `${t.from} ${euro(lang, retreat.priceFrom)}` : "";
  const when = [dateRange(lang, retreat.startDate, retreat.endDate), retreat.country, !past && retreat.capacity ? `${t.max} ${retreat.capacity}` : null].filter(Boolean).join(" · ");
  return (
    <Link className="card" href={retreatHref(lang, retreat.slug)}>
      <Photo media={retreat.cardPhoto} ratio="r45" className={past ? "bw" : undefined} sizes="(max-width: 860px) 100vw, 33vw" />
      <div className="meta">
        <span className={`tag${past ? " past" : ""}`}>{tag ?? (past ? t.past : t.soon)}</span>
        <span>{extra}</span>
      </div>
      <h4>{retreat.title}</h4>
      <div className="meta" style={{ marginTop: 4 }}>
        <span>{when}</span>
      </div>
    </Link>
  );
}

/** Class tiles with hover/tap reveal: what · for whom · where. */
export function ClassTiles({ lang, styles, to }: { lang: Lang; styles: StyleData[]; to: string }) {
  const t = getDictionary(lang).tile;
  return (
    <div className="g4">
      {styles.map((s) => (
        <Link key={s._id} className="tile" href={to}>
          <Photo media={s.photo} ratio="r34" sizes="(max-width: 860px) 50vw, 25vw" />
          <span className="name">{s.name}</span>
          <div className="info">
            <b>{s.name}</b>
            <dl>
              {s.what ? (
                <>
                  <dt>{t.what}</dt>
                  <dd>{s.what}</dd>
                </>
              ) : null}
              {s.forWhom ? (
                <>
                  <dt>{t.forWhom}</dt>
                  <dd>{s.forWhom}</dd>
                </>
              ) : null}
              {s.studios?.length ? (
                <>
                  <dt>{t.where}</dt>
                  <dd>{s.studios.join(" · ")}</dd>
                </>
              ) : null}
            </dl>
          </div>
        </Link>
      ))}
    </div>
  );
}
