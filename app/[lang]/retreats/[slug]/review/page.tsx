import Link from "next/link";
import { notFound } from "next/navigation";
import { FeedbackForm } from "@/components/FeedbackForm";
import { ReviewForm } from "@/components/Forms";
import { Photo } from "@/components/Photo";
import { getDictionary } from "@/lib/dictionary";
import { dateRange, join } from "@/lib/format";
import { buildMetadata } from "@/lib/metadata";
import { withDefaults } from "@/lib/review-form";
import { langParam, retreatHref } from "@/lib/routes";
import { sanityFetch } from "@/sanity/fetch";
import { RETREAT_SLUGS_QUERY, SIGNUP_PAGE_QUERY } from "@/sanity/queries";

/**
 * A retreat's review page (/retreats/<slug>/review): only the form. Not linked anywhere on the site and
 * not indexed; Rita & Philippe send the link to participants (Studio → retreat → Achteraf → Reviewlink,
 * or a Brief with “Knop: feedbackformulier”). Works for every retreat, also before it ended (to test).
 * The retreat's published feedback form (Studio → Formulieren → Feedbackformulieren; else the one marked
 * Standaard) → that form; none → the short review form. Published reviews show on the retreat page.
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
  const meta = await buildMetadata({ lang, route: "retreats", slug, fallbackTitle: `Review: ${retreat.title}` });
  return { ...meta, alternates: undefined, robots: { index: false, follow: false } };
}

export default async function ReviewPage({ params }: Props) {
  const { lang, retreat: r } = await load(params);
  if (!r) notFound();
  const t = getDictionary(lang).review;
  const facts = [dateRange(lang, r.startDate, r.endDate), join(r.place, r.country)].filter(Boolean);
  const form = r.reviewForm?.questions?.length ? r.reviewForm : null;
  const fill = (text: string) => text.replace(/\{retreat\}/g, r.title ?? "");

  return (
    <section className={form ? "split feedback-split" : "split"}>
      <Photo media={r.photo ?? r.cardPhoto} sizes="(max-width: 860px) 100vw, 50vw" priority />
      <div className="pane">
        <span className="label">{form?.title ? r.title : t.formTitle}</span>
        <h1 style={{ fontSize: "clamp(2.2rem,4.5vw,3.6rem)", marginBottom: 12 }}>{form?.title ? fill(form.title) : r.title}</h1>
        <p className="muted">{facts.join(" · ")}</p>
        <p className="form-intro">{form ? (form.intro ? fill(form.intro) : t.pageIntro) : t.pageIntro}</p>
        <Link className="link small" href={retreatHref(lang, r.slug)}>
          ← {getDictionary(lang).signup.backToRetreat}
        </Link>
        <div style={{ marginTop: 28 }}>
          {form ? <FeedbackForm lang={lang} retreatId={r._id} questions={withDefaults(form.questions, lang, r.title ?? "")} /> : <ReviewForm lang={lang} retreatId={r._id} />}
        </div>
      </div>
    </section>
  );
}
