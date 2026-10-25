/**
 * v2 schema migration (docs/plan.html, Part 2). Run once, after deploying the v2 Studio, before content-v2.ts.
 *
 *   npx sanity exec scripts/migrate-v2.ts --with-user-token -- --dry   # prints what it would do
 *   npx sanity exec scripts/migrate-v2.ts --with-user-token            # applies it
 *
 * On published documents and their drafts:
 *  - S18 Fotobank: unsets title, place, takenAt, credit, description, retreat. Alt text is never
 *    overwritten; a photo without alt text in a language gets its title copied there first, so no text is lost.
 *  - S3  Coaching page → lessonsPage.private (photo, button text), then deletes coachingPage.
 *  - S2  Over ons: principles → values; drops principlesTitle/principlesLabel.
 *  - S1  Personen: kind = founder for Over ons → founders, collaborator for everyone else (if not set).
 *  - S4  privacyPage → legalPage `legal-privacy` (same content), then deletes privacyPage.
 *  - S10/W15 Instellingen: drops menuSearch and menuGallery.
 *  - S6  Retreats: booked = people on confirmed sign-ups (old sign-ups keep their `persons`, new ones count 1).
 */
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { getCliClient } from "sanity/cli";
import { apiVersion } from "../../sanity/site.config.ts";

const DRY = process.argv.includes("--dry");
if (existsSync(".env")) process.loadEnvFile(".env");
const token = process.env.SANITY_AUTH_TOKEN || undefined;
const client = getCliClient({ apiVersion, ...(token ? { token } : {}) });

type I18n = { _key: string; _type?: string; language?: string; value?: unknown };
type Doc = { _id: string; _type: string; [k: string]: unknown };
const key = () => randomUUID().replace(/-/g, "").slice(0, 12);
const hasText = (i?: I18n) => typeof i?.value === "string" && i.value.trim().length > 0;
const both = (id: string) => [id, `drafts.${id.replace(/^drafts\./, "")}`];

const tx = client.transaction();
const log: string[] = [];
const patch = (id: string, ops: { set?: Record<string, unknown>; unset?: string[] }, why: string) => {
  if (!ops.set && !ops.unset?.length) return;
  tx.patch(id, (p) => (ops.unset?.length ? (ops.set ? p.set(ops.set).unset(ops.unset) : p.unset(ops.unset)) : p.set(ops.set!)));
  log.push(`${id}: ${why}`);
};

async function run() {
  const docs = await client.fetch<Doc[]>(
    `*[_type in ["mediaItem", "coachingPage", "lessonsPage", "aboutPage", "person", "privacyPage", "settings"] || _id in ["legal-privacy", "drafts.legal-privacy"]]`,
    {},
    { perspective: "raw" },
  );
  const byId = new Map(docs.map((d) => [d._id, d]));

  /* S18: Fotobank */
  const MEDIA_OLD = ["title", "place", "takenAt", "credit", "description", "retreat"];
  for (const d of docs.filter((d) => d._type === "mediaItem")) {
    const unset = MEDIA_OLD.filter((f) => d[f] !== undefined);
    if (!unset.length) continue;
    const alt = (d.alt as I18n[] | undefined) ?? [];
    const copies = ((d.title as I18n[] | undefined) ?? []).filter((t) => hasText(t) && !alt.some((a) => a.language === t.language && hasText(a)));
    const set = copies.length
      ? { alt: [...alt.filter((a) => !copies.some((c) => c.language === a.language)), ...copies.map((c) => ({ _key: key(), _type: "internationalizedArrayStringValue", language: c.language, value: c.value }))] }
      : undefined;
    patch(d._id, { set, unset }, `keep alt${copies.length ? `, copy title → alt (${copies.map((c) => c.language).join(", ")})` : ""}, remove ${unset.join(", ")}`);
  }

  /* S3: Coaching → Lessen › Privéles */
  const coaching = byId.get("coachingPage") ?? byId.get("drafts.coachingPage");
  if (coaching) {
    const lessons = byId.get("lessonsPage");
    const photo = (coaching.photos as { _ref: string }[] | undefined)?.[0];
    const button = coaching.ctaButton as I18n[] | undefined;
    if (lessons && !lessons.private) patch("lessonsPage", { set: { private: { ...(photo ? { photo: { _type: "reference", _ref: photo._ref } } : {}), ...(button?.length ? { button } : {}) } } }, "private ← coachingPage (photo, button)");
    for (const id of both("coachingPage")) if (byId.has(id)) (tx.delete(id), log.push(`${id}: delete`));
  }

  /* S2: principles → values */
  for (const id of both("aboutPage")) {
    const d = byId.get(id);
    if (!d) continue;
    const principles = d.principles as (Record<string, unknown> & { _key: string })[] | undefined;
    const unset = ["principles", "principlesTitle", "principlesLabel"].filter((f) => d[f] !== undefined);
    const set = principles?.length && !d.values ? { values: principles.map((p) => ({ ...p, _type: "value" })) } : undefined;
    patch(id, { set, unset }, `${set ? "values ← principles, " : ""}remove ${unset.join(", ")}`);
  }

  /* S1: person.kind */
  const founders = new Set(((byId.get("aboutPage")?.founders as { _ref: string }[] | undefined) ?? []).map((r) => r._ref));
  for (const d of docs.filter((d) => d._type === "person" && !d.kind)) {
    const kind = founders.has(d._id.replace(/^drafts\./, "")) ? "founder" : "collaborator";
    patch(d._id, { set: { kind } }, `kind = ${kind}`);
  }

  /* S4: privacyPage → legal-privacy */
  for (const id of both("privacyPage")) {
    const d = byId.get(id);
    if (!d) continue;
    const target = id.startsWith("drafts.") ? "drafts.legal-privacy" : "legal-privacy";
    if (!byId.has(target)) {
      const { _id, _type, _rev, _createdAt, _updatedAt, ...rest } = d;
      const sections = (rest.sections as Record<string, unknown>[] | undefined)?.map((s) => ({ ...s, _type: "legalSection" }));
      tx.createIfNotExists({ ...rest, sections, _id: target, _type: "legalPage" });
      log.push(`${target}: create from ${id}`);
    }
    tx.delete(id);
    log.push(`${id}: delete`);
  }

  /* S10 / W15: settings */
  for (const id of both("settings")) {
    const d = byId.get(id);
    if (!d) continue;
    patch(id, { unset: ["menuSearch", "menuGallery"].filter((f) => d[f] !== undefined) }, "remove menuSearch, menuGallery");
  }

  /* S6: booked = confirmed sign-ups */
  const retreats = await client.fetch<{ _id: string; booked?: number; count: number }[]>(
    `*[_type == "retreat"]{ _id, booked, "count": coalesce(math::sum(*[_type == "signup" && retreat._ref == string::split(^._id, "drafts.")[-1] && status == "confirmed"]{ "p": coalesce(persons, 1) }.p), 0) }`,
    {},
    { perspective: "raw" },
  );
  for (const r of retreats) if ((r.booked ?? 0) !== r.count) patch(r._id, { set: { booked: r.count } }, `booked ${r.booked ?? 0} → ${r.count}`);

  console.log(log.length ? log.join("\n") : "Nothing to migrate.");
  if (DRY) return console.log(`\nDRY RUN: ${log.length} changes, nothing written.`);
  if (log.length) await tx.commit();
  console.log(`\nDone: ${log.length} changes.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
