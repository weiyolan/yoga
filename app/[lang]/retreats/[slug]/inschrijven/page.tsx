import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignupForm } from "@/components/Forms";
import { Photo } from "@/components/Photo";
import { getDictionary } from "@/lib/dictionary";
import { dateRange, euro, join, placesLabel, spotsLeft } from "@/lib/format";
import { buildMetadata } from "@/lib/metadata";
import { langParam, retreatHref } from "@/lib/routes";
import { isUpcoming, sanityFetch } from "@/sanity/fetch";
import { LAYOUT_QUERY, RETREAT_SLUGS_QUERY, SIGNUP_PAGE_QUERY } from "@/sanity/queries";

/**
 * A retreat's sign-up page (/retreats/<slug>/inschrijven, /en/retreats/<slug>/sign-up): a short
 * summary, then the form. Full → the same form as a waiting list. Past retreat → back to its page;
 * an external sign-up link (Studio) → there. Not indexed.
 */
export async function generateStaticParams() {
  const slugs = await sanityFetch({ query: RETREAT_SLUGS_QUERY });
  return slugs.filter(Boolean).map((slug) => ({ slug: slug! }));
}

type Props = PageProps<"/[lang]/retreats/[slug]/inschrijven">;

async function load(params: Props["params"]) {
  const lang = await langParam(params);
  const { slug } = await params;
  const retreat = await sanityFetch({ query: SIGNUP_PAGE_QUERY, params: { slug }, lang });
  return { lang, slug, retreat };
}

export async function generateMetadata({ params }: Props) {
  const { lang, slug, retreat } = await load(params);
  if (!retreat) return {};
  const t = getDictionary(lang).signup;
  const meta = await buildMetadata({ lang, route: "retreats", slug, fallbackTitle: `${t.pageLabel}: ${retreat.title}`, fallbackImage: retreat.photo });
  return { ...meta, alternates: undefined, robots: { index: false, follow: true } };
}

export default async function SignupPage({ params }: Props) {
  const { lang, retreat: r } = await load(params);
  if (!r) notFound();
  if (!isUpcoming(r.endDate)) redirect(retreatHref(lang, r.slug));
  if (r.signupUrl) redirect(r.signupUrl);
  const d = getDictionary(lang);
  const t = d.signup;
  const texts = (await sanityFetch({ query: LAYOUT_QUERY, lang }))?.texts;
  const full = spotsLeft(r) === 0;
  const facts = [dateRange(lang, r.startDate, r.endDate), join(r.place, r.country), r.priceFrom ? `${d.card.from} ${euro(lang, r.priceFrom)}` : null, placesLabel(lang, r)].filter(Boolean);

  return (
    <section className="split">
      <Photo media={r.photo ?? r.cardPhoto} sizes="(max-width: 860px) 100vw, 50vw" priority />
      <div className="pane">
        <span className="label">{full ? t.waitlistLabel : t.pageLabel}</span>
        <h1 style={{ fontSize: "clamp(2.2rem,4.5vw,3.6rem)", marginBottom: 12 }}>{r.title}</h1>
        <p className="muted">{facts.join(" · ")}</p>
        <Link className="link small" href={retreatHref(lang, r.slug)}>
          ← {t.backToRetreat}
        </Link>
        <SignupForm
          lang={lang}
          retreatId={r._id}
          rooms={(r.prices ?? []).map((p) => [p.label, euro(lang, p.amount)].filter(Boolean).join(" · "))}
          form={r.form}
          texts={{ thanks: texts?.signupThanks, consent: texts?.signupConsent, terms: texts?.signupTerms }}
          full={full}
        />
      </div>
    </section>
  );
}
