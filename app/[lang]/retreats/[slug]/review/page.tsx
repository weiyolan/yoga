import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReviewForm } from "@/components/Forms";
import { Photo } from "@/components/Photo";
import { getDictionary } from "@/lib/dictionary";
import { dateRange, join } from "@/lib/format";
import { buildMetadata } from "@/lib/metadata";
import { langParam, retreatHref } from "@/lib/routes";
import { isUpcoming, sanityFetch } from "@/sanity/fetch";
import { RETREAT_SLUGS_QUERY, SIGNUP_PAGE_QUERY } from "@/sanity/queries";

/**
 * A past retreat's review page (/retreats/<slug>/review): only the form. Not linked anywhere on the
 * site and not indexed; Rita & Philippe send the link to participants (Studio → retreat →
 * “Kopieer reviewlink”). Upcoming retreat → its page. Published reviews show on the retreat page.
 */
export async function generateStaticParams() {
  const slugs = await sanityFetch({ query: RETREAT_SLUGS_QUERY });
  return slugs.filter(Boolean).map((slug) => ({ slug: slug! }));
}

type Props = PageProps<"/[lang]/retreats/[slug]/review">;

async function load(params: Props["params"]) {
  const lang = await langParam(params);
  const { slug } = await params;
  const retreat = await sanityFetch({ query: SIGNUP_PAGE_QUERY, params: { slug }, lang });
  return { lang, slug, retreat };
}

export async function generateMetadata({ params }: Props) {
  const { lang, slug, retreat } = await load(params);
  if (!retreat) return {};
  const meta = await buildMetadata({ lang, route: "retreats", slug, fallbackTitle: `Review: ${retreat.title}`, fallbackImage: retreat.photo });
  return { ...meta, alternates: undefined, robots: { index: false, follow: false } };
}

export default async function ReviewPage({ params }: Props) {
  const { lang, retreat: r } = await load(params);
  if (!r) notFound();
  if (isUpcoming(r.endDate)) redirect(retreatHref(lang, r.slug));
  const t = getDictionary(lang).review;
  const facts = [dateRange(lang, r.startDate, r.endDate), join(r.place, r.country)].filter(Boolean);

  return (
    <section className="split">
      <Photo media={r.photo ?? r.cardPhoto} sizes="(max-width: 860px) 100vw, 50vw" priority />
      <div className="pane">
        <span className="label">{t.formTitle}</span>
        <h1 style={{ fontSize: "clamp(2.2rem,4.5vw,3.6rem)", marginBottom: 12 }}>{r.title}</h1>
        <p className="muted">{facts.join(" · ")}</p>
        <p>{t.pageIntro}</p>
        <Link className="link small" href={retreatHref(lang, r.slug)}>
          ← {getDictionary(lang).signup.backToRetreat}
        </Link>
        <div style={{ marginTop: 28 }}>
          <ReviewForm lang={lang} retreatId={r._id} />
        </div>
      </div>
    </section>
  );
}
