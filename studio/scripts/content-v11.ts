/**
 * Content v11 → the live dataset: the example feedback form “Evaluatie retreat (voorbeeld Eifel)” (Rita &
 * Philippe's Google Form “Evaluatie Yoga Retreat Eifel 2026”, NL + EN; studio/lib/review-example.ts), published
 * (a form only shows on a retreat that picks it, or when marked Standaard), and picked on the Eifel 2026 retreat
 * as a retreat DRAFT if that one has no feedback form yet: publish it to put the form on its review page.
 * Only creates the form if no feedback form with that name exists.
 *
 *   npx sanity exec scripts/content-v11.ts --with-user-token -- --dry   # prints what it would do
 *   npx sanity exec scripts/content-v11.ts --with-user-token
 */
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { getCliClient } from "sanity/cli";
import { apiVersion } from "../../sanity/site.config.ts";
import { reviewExample } from "../lib/review-example.ts";

const DRY = process.argv.includes("--dry");
if (existsSync(".env")) process.loadEnvFile(".env");
const token = process.env.SANITY_AUTH_TOKEN || undefined;
const client = getCliClient({ apiVersion, ...(token ? { token } : {}) });

async function run() {
  const example = reviewExample();
  const tx = client.transaction();
  const log: string[] = [];
  const existing = await client.fetch<string | null>(`*[_type == "reviewForm" && name == $name && !(_id in path("drafts.**"))][0]._id`, { name: example.name });
  const formId = existing ?? `reviewForm-${randomUUID().slice(0, 8)}`;
  if (existing) log.push(`${example.name}: exists (${existing}), kept`);
  else {
    tx.create({ _id: formId, _type: "reviewForm", isDefault: false, ...example });
    log.push(`${example.name}: create + publish (${example.questions.filter((q) => q.type !== "section").length} questions)`);
  }

  const retreats = await client.fetch<{ _id: string; slug: string | null; startDate: string; reviewForm?: unknown }[]>(
    `*[_type == "retreat" && !(_id in path("drafts.**")) && startDate >= "2026-01-01" && startDate < "2027-01-01" && (slug.current match "eifel*" || title[language == "nl"][0].value match "eifel*")]{ _id, "slug": slug.current, startDate, reviewForm }`,
  );
  for (const r of retreats) {
    const draft = await client.getDocument<{ reviewForm?: unknown }>(`drafts.${r._id}`);
    if ((draft ?? r).reviewForm) {
      log.push(`  retreat ${r.slug} (${r.startDate}): already has a feedback form, skipped`);
      continue;
    }
    if (!draft) tx.createIfNotExists({ ...(await client.getDocument(r._id))!, _id: `drafts.${r._id}` });
    tx.patch(`drafts.${r._id}`, (p) => p.set({ reviewForm: { _type: "reference", _ref: formId } }));
    log.push(`  retreat ${r.slug} (${r.startDate}): pick it (draft: publish the retreat)`);
  }
  if (!retreats.length) log.push("  no Eifel 2026 retreat found: pick the form on the retreat yourself (tab Achteraf)");

  console.log(log.join("\n"));
  if (DRY) return console.log("\n--dry: nothing written");
  await tx.commit();
  console.log("\nDone. Formulieren → Feedbackformulieren; publish the retreat draft.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
