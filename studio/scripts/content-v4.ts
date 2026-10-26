/**
 * Content v4 → the live dataset, as DRAFTS (Rita & Philippe review and publish):
 *  - Contact → Nieuwsbrieven: an example newsletter “Nieuwe retreats” with every upcoming retreat as a
 *    card, the first one's photo on top and a button to /retreats. Only if there is no newsletter yet.
 *  - Reviews: the two existing public reviews get their name and text in [brackets], so they show up in
 *    “Nog in te vullen [ ]” as examples to replace by real reviews (draft; the live site keeps the old text
 *    until you publish).
 *
 *   npx sanity exec scripts/content-v4.ts --with-user-token -- --dry   # prints every change
 *   npx sanity exec scripts/content-v4.ts --with-user-token
 */
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { getCliClient } from "sanity/cli";
import { apiVersion } from "../../sanity/site.config.ts";

const DRY = process.argv.includes("--dry");
if (existsSync(".env")) process.loadEnvFile(".env");
const token = process.env.SANITY_AUTH_TOKEN || undefined;
const client = getCliClient({ apiVersion, ...(token ? { token } : {}) });

type Tr = { nl: string; en: string };
const key = () => randomUUID().replace(/-/g, "").slice(0, 12);
const str = (v: Tr) => Object.entries(v).map(([language, value]) => ({ _key: key(), _type: "internationalizedArrayStringValue", language, value }));
/** Paragraphs (blank line between) → Portable Text, per language. */
const blocks = (v: { nl: string[]; en: string[] }) =>
  Object.entries(v).map(([language, ps]) => ({
    _key: key(),
    _type: "internationalizedArraySimpleBlockContentValue",
    language,
    value: ps.map((text) => ({ _key: key(), _type: "block", style: "normal", markDefs: [], children: [{ _key: key(), _type: "span", text, marks: [] }] })),
  }));
const bracket = (s?: string) => (!s ? s : s.startsWith("[") ? s : `[${s}]`);

const tx = client.transaction();
const log: string[] = [];

async function run() {
  /* example newsletter */
  const existing = await client.fetch<number>(`count(*[_type == "newsletter"])`);
  if (existing) log.push(`newsletter: ${existing} already, skipped`);
  else {
    const upcoming = await client.fetch<{ _id: string; photo?: string }[]>(
      `*[_type == "retreat" && !(_id in path("drafts.**")) && dateTime(endDate + "T23:59:59Z") >= dateTime(now())] | order(startDate asc){ _id, "photo": cardPhoto._ref }`,
    );
    tx.create({
      _id: `drafts.${randomUUID()}`,
      _type: "newsletter",
      title: "Nieuwe retreats",
      subject: str({ nl: "Nieuwe retreats: ga je mee?", en: "New retreats: will you join us?" }),
      ...(upcoming[0]?.photo ? { image: { _type: "reference", _ref: upcoming[0].photo } } : {}),
      heading: str({ nl: "Nieuwe retreats", en: "New retreats" }),
      body: blocks({
        nl: [
          "Dag {naam},",
          "De nieuwe retreats staan klaar! Opnieuw plekken waar yoga, natuur en een goede tafel samenkomen: rustig wakker worden met yoga, overdag de natuur in, 's avonds samen aan tafel.",
          "Hieronder vind je wat eraan komt. De groepen zijn klein, dus wie er snel bij is, kiest zijn kamer. Vragen? Antwoord gewoon op deze mail.",
          "Tot snel,\nRita & Philippe",
        ],
        en: [
          "Hi {naam},",
          "Our new retreats are ready! Once again places where yoga, nature and a good table come together: waking up slowly with yoga, out into nature during the day, dinner together at night.",
          "Below is what's coming up. Groups are small, so the early ones get to pick their room. Questions? Just reply to this mail.",
          "See you soon,\nRita & Philippe",
        ],
      }),
      retreats: upcoming.map((r) => ({ _key: key(), _type: "reference", _ref: r._id })),
      buttonLabel: str({ nl: "Bekijk alle retreats", en: "See all retreats" }),
      buttonUrl: "/retreats",
      audience: ["subscribers", "participants"],
    });
    log.push(`newsletter “Nieuwe retreats”: create draft (${upcoming.length} retreat cards)`);
  }

  /* reviews: [brackets] */
  const reviews = await client.fetch<{ _id: string; name?: string; text?: string }[]>(`*[_type == "review" && !(_id in path("drafts.**"))]{ _id, name, text }`);
  for (const r of reviews) {
    const draft = await client.getDocument(`drafts.${r._id}`);
    const base = (draft ?? (await client.getDocument(r._id)))!;
    const name = bracket(base.name as string | undefined);
    const text = bracket(base.text as string | undefined);
    if (name === base.name && text === base.text) {
      log.push(`review ${r.name}: already in brackets, skipped`);
      continue;
    }
    const { _rev, _createdAt, _updatedAt, ...fields } = base;
    void _rev, void _createdAt, void _updatedAt;
    tx.createOrReplace({ ...fields, _id: `drafts.${r._id}`, _type: "review", name, text });
    log.push(`review ${r.name}: draft → name “${name}”, text “${text?.slice(0, 50)}”`);
  }

  console.log(log.join("\n"));
  if (DRY) return console.log("\n--dry: nothing written");
  await tx.commit();
  console.log("\nDone. Review in the Studio and publish.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
