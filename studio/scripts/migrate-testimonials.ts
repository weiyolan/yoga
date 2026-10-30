/**
 * Testimonials and reviews become one kind: `testimonial` (feedback v3 #4). Run once after deploying the Studio.
 *
 *   npx sanity exec scripts/migrate-testimonials.ts --with-user-token -- --dry   # prints what it would do
 *   npx sanity exec scripts/migrate-testimonials.ts --with-user-token            # applies it
 *
 *  - Every `review` (public copy of a form submission, `review-<uuid>`, or typed in) → `testimonial-<uuid>`
 *    with Bron “Formulier”, Op Home on (at 4★+) and Op de retreatpagina on; the text goes in the language of the review.
 *  - The old testimonials get Bron “Zelf toegevoegd” and Op Home on, unless the name is still a [placeholder].
 *  - A typed-in testimonial with the same name and retreat as a review is the same quote twice: the review
 *    (with the score) stays, the typed one is deleted.
 *  - Home: the old picked list `testimonials` is removed (published + draft), then the `review` documents.
 */
import { existsSync } from "node:fs";
import { getCliClient } from "sanity/cli";
import { apiVersion } from "../../sanity/site.config.ts";

const DRY = process.argv.includes("--dry");
if (existsSync(".env")) process.loadEnvFile(".env");
const token = process.env.SANITY_AUTH_TOKEN || undefined;
const client = getCliClient({ apiVersion, ...(token ? { token } : {}) });

type Ref = { _ref: string; _type: "reference" };
type Review = { _id: string; name?: string; rating?: number; text?: string; lang?: string; submittedAt?: string; retreat?: Ref; _createdAt: string };
type Testimonial = { _id: string; name?: string; retreat?: Ref; source?: string; showOnHome?: boolean; _createdAt: string };

const live = (id: string) => id.replace(/^drafts\./, "");
const newId = (id: string) => `testimonial-${live(id).replace(/^review-/, "")}`;
const same = (a?: string, b?: string) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

async function run() {
  const log: string[] = [];
  const [reviews, testimonials] = await Promise.all([
    client.fetch<Review[]>(`*[_type == "review"]{ _id, name, rating, text, lang, submittedAt, retreat, _createdAt }`, {}, { perspective: "raw" }),
    client.fetch<Testimonial[]>(`*[_type == "testimonial"]{ _id, name, retreat, source, showOnHome, _createdAt }`, {}, { perspective: "raw" }),
  ]);
  const tx = client.transaction();

  // Home: no more picked list (it held strong references to testimonials)
  for (const id of ["homePage", "drafts.homePage"]) {
    const has = await client.fetch<boolean>(`defined(*[_id == $id][0].testimonials)`, { id });
    if (has) {
      tx.patch(id, (p) => p.unset(["testimonials"]));
      log.push(`${id}: testimonials list removed`);
    }
  }

  // reviews → testimonials (a draft of a review: only if there is no published one)
  const published = new Set(reviews.filter((r) => !r._id.startsWith("drafts.")).map((r) => r._id));
  for (const r of reviews) {
    if (r._id.startsWith("drafts.") && published.has(live(r._id))) continue;
    const lang = r.lang || "nl";
    const doc = {
      _id: newId(r._id),
      _type: "testimonial",
      source: "form",
      showOnHome: (r.rating ?? 0) >= 4,
      showOnRetreat: true,
      name: r.name,
      rating: r.rating,
      quote: [{ _key: lang, _type: "internationalizedArrayTextValue", language: lang, value: r.text ?? "" }],
      lang,
      date: r.submittedAt ?? r._createdAt,
      ...(r.retreat ? { retreat: { _type: "reference", _ref: live(r.retreat._ref) } } : {}),
    };
    tx.createIfNotExists(doc);
    log.push(`${r._id} → ${doc._id} (${r.name}, ${r.rating ?? "-"}★, Op Home ${doc.showOnHome ? "aan" : "uit"})`);
  }

  // the typed-in testimonials
  for (const t of testimonials) {
    if (t.source === "form" || live(t._id).startsWith("testimonial-")) continue;
    const twin = reviews.find((r) => same(r.name, t.name) && r.retreat && t.retreat && live(r.retreat._ref) === live(t.retreat._ref));
    if (twin) {
      tx.delete(t._id);
      log.push(`${t._id} (${t.name}): same as ${twin._id} → deleted (the one with the score stays)`);
      continue;
    }
    const placeholder = /\[[^\]]*\]/.test(t.name ?? "");
    tx.patch(t._id, (p) => p.setIfMissing({ source: "manual", showOnHome: !placeholder, showOnRetreat: true, date: t._createdAt, lang: "nl" }));
    log.push(`${t._id} (${t.name}): Bron Zelf toegevoegd, Op Home ${placeholder ? "uit (naam nog in te vullen)" : "aan"}`);
  }

  for (const r of reviews) {
    tx.delete(r._id);
    log.push(`${r._id}: review deleted`);
  }

  console.log(log.join("\n") || "nothing to do");
  if (DRY) return console.log("\n(dry run: nothing written)");
  await tx.commit({ visibility: "async" });
  console.log("\ndone");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
