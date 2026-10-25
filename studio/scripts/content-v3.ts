/**
 * Content v3 → the live dataset, as DRAFTS (Rita & Philippe review and publish):
 *  - Veelgestelde vragen (/faq): a first version (scripts/v2-content.ts → faq), if the page doesn't exist yet.
 *  - Eifel (upcoming): prices, inbegrepen / niet inbegrepen and programme from eiffel.txt, only where still
 *    empty. These fill the summary card's links (Programma, Praktisch) on the retreat page.
 *
 *   npx sanity exec scripts/content-v3.ts --with-user-token -- --dry   # prints every change
 *   npx sanity exec scripts/content-v3.ts --with-user-token
 */
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { getCliClient } from "sanity/cli";
import { apiVersion } from "../../sanity/site.config.ts";
import * as v2 from "./v2-content.ts";

const DRY = process.argv.includes("--dry");
if (existsSync(".env")) process.loadEnvFile(".env");
const token = process.env.SANITY_AUTH_TOKEN || undefined;
const client = getCliClient({ apiVersion, ...(token ? { token } : {}) });

type Tr = { nl: string; en?: string };
const key = () => randomUUID().replace(/-/g, "").slice(0, 12);
const i18n = (kind: "String" | "Text", v: Tr) => Object.entries(v).filter(([, x]) => x).map(([language, value]) => ({ _key: key(), _type: `internationalizedArray${kind}Value`, language, value }));
const str = (v: Tr) => i18n("String", v);
const txt = (v: Tr) => i18n("Text", v);
const lines = (v: { nl: string[]; en: string[] }) => txt({ nl: v.nl.join("\n"), en: v.en.join("\n") });
const empty = (v: unknown) => v === undefined || v === null || (Array.isArray(v) && v.length === 0);

const tx = client.transaction();
const log: string[] = [];

async function run() {
  /* Veelgestelde vragen */
  const [faqPub, faqDraft] = await Promise.all([client.getDocument("faqPage"), client.getDocument("drafts.faqPage")]);
  if (faqPub || faqDraft) log.push("faqPage: exists, skipped");
  else {
    tx.create({
      _id: "drafts.faqPage",
      _type: "faqPage",
      title: str(v2.faq.title),
      intro: txt(v2.faq.intro),
      groups: v2.faq.groups.map((g) => ({
        _key: key(),
        _type: "faqGroup",
        title: str(g.title),
        items: g.items.map((i) => ({ _key: key(), _type: "faqItem", question: str(i.q), answer: txt(i.a) })),
      })),
    });
    log.push(`drafts.faqPage: create (${v2.faq.groups.reduce((n, g) => n + g.items.length, 0)} questions)`);
  }

  /* Eifel: practical info, only where empty */
  const eifel = await client.fetch<{ _id: string } | null>(
    `*[_type == "retreat" && !(_id in path("drafts.**")) && slug.current match "eifel*" && dateTime(endDate + "T23:59:59Z") >= dateTime(now())] | order(startDate asc)[0]{ _id }`,
  );
  if (!eifel) log.push("Eifel: no upcoming Eifel retreat found, skipped");
  else {
    const [pub, draft] = await Promise.all([client.getDocument(eifel._id), client.getDocument(`drafts.${eifel._id}`)]);
    const base = (draft ?? pub)!;
    const set: Record<string, unknown> = {};
    if (empty(base.prices)) set.prices = v2.eifel.prices.map((p) => ({ _key: key(), _type: "price", label: str(p.label), amount: p.amount }));
    if (empty(base.included)) set.included = lines(v2.eifel.included);
    if (empty(base.notIncluded)) set.notIncluded = lines(v2.eifel.notIncluded);
    if (empty(base.programme)) set.programme = v2.eifel.programme.map((p) => ({ _key: key(), _type: "programmeItem", title: str(p.title), text: txt(p.text) }));
    if (!Object.keys(set).length) log.push(`${eifel._id}: prices, included and programme already filled, skipped`);
    else {
      if (!draft) tx.createIfNotExists({ ...base, _id: `drafts.${eifel._id}` });
      tx.patch(`drafts.${eifel._id}`, (p) => p.set(set));
      log.push(`drafts.${eifel._id}: set ${Object.keys(set).join(", ")}`);
    }
  }

  console.log(log.join("\n"));
  if (DRY) return console.log("\nDRY RUN: nothing written.");
  await tx.commit();
  console.log("\nDone. Review the drafts in the Studio (Live preview) and publish.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
