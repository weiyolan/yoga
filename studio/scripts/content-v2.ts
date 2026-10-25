/**
 * Content v2 (docs/plan.html, Part 1) → the live dataset, as DRAFTS: Rita & Philippe review them in
 * Live preview and publish themselves. Only the fields below are replaced; other Studio edits stay.
 * Rita's lesson schedule is never touched. Run after migrate-v2.ts.
 *
 *   npx sanity exec scripts/content-v2.ts --with-user-token -- --dry   # prints every change
 *   npx sanity exec scripts/content-v2.ts --with-user-token
 */
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { getCliClient } from "sanity/cli";
import { getDictionary } from "../../lib/dictionary.ts";
import { apiVersion } from "../../sanity/site.config.ts";
import * as v2 from "./v2-content.ts";

const DRY = process.argv.includes("--dry");
if (existsSync(".env")) process.loadEnvFile(".env");
const token = process.env.SANITY_AUTH_TOKEN || undefined;
const client = getCliClient({ apiVersion, ...(token ? { token } : {}) });

type Tr = { nl: string; en?: string };
type Doc = { _id: string; _type: string; [k: string]: unknown };
const key = () => randomUUID().replace(/-/g, "").slice(0, 12);
const i18n = (kind: "String" | "Text", v: Tr) => Object.entries(v).filter(([, x]) => x).map(([language, value]) => ({ _key: key(), _type: `internationalizedArray${kind}Value`, language, value }));
const str = (v: Tr) => i18n("String", v);
const txt = (v: Tr) => i18n("Text", v);
const lines = (nl: string[], en?: string[]) => txt({ nl: nl.join("\n"), en: en?.join("\n") });
const blocks = (v: Tr) =>
  Object.entries(v).map(([language, text]) => ({
    _key: key(),
    _type: "internationalizedArraySimpleBlockContentValue",
    language,
    value: [{ _key: key(), _type: "block", style: "normal", markDefs: [], children: [{ _key: key(), _type: "span", text, marks: [] }] }],
  }));
const ref = (id: string) => ({ _type: "reference", _ref: id });
/** A reference to a document that only exists as a draft: becomes a normal reference when both are published. */
const draftRef = (id: string, type: string) => ({ _type: "reference", _ref: id, _weak: true, _strengthenOnPublish: { type } });

const tx = client.transaction();
const log: string[] = [];

/** Patch the draft of `id` (created from the published document if there's none yet). */
async function draft(id: string, set: Record<string, unknown>, unset: string[] = []) {
  const [published, existing] = await Promise.all([client.getDocument(id), client.getDocument(`drafts.${id}`)]);
  const base = existing ?? published;
  if (!base) return void log.push(`⚠ ${id}: not found, skipped`);
  if (!existing) tx.createIfNotExists({ ...base, _id: `drafts.${id}` });
  tx.patch(`drafts.${id}`, (p) => (unset.length ? p.set(set).unset(unset) : p.set(set)));
  log.push(`drafts.${id}: set ${Object.keys(set).join(", ")}${unset.length ? `; unset ${unset.join(", ")}` : ""}`);
}

/** A new document, as a draft only. */
function create(doc: Doc, why: string) {
  tx.createIfNotExists(doc);
  log.push(`${doc._id}: create ${why}`);
}

async function run() {
  const nlDict = getDictionary("nl");

  /* settings: tagline, SEO, mails */
  await draft("settings", {
    tagline: str(v2.tagline),
    "seo.description": txt(v2.seoDescription),
    signupMail: txt(v2.mails.signupMail),
    paymentMail: txt(v2.mails.paymentMail),
  });

  /* Home */
  const home = await client.getDocument("homePage");
  const placeholder = await client.fetch<string[]>(`*[_type == "testimonial" && name == "[Naam]"]._id`);
  const testimonials = ((home?.testimonials as { _key: string; _ref: string }[] | undefined) ?? []).filter((r) => !placeholder.includes(r._ref));
  await draft("homePage", {
    "hero.title": str(v2.home.heroTitle),
    "hero.subtitle": txt(v2.home.heroSubtitle),
    introTitle: str(v2.home.introTitle),
    intro: txt(v2.home.intro),
    aboutText: txt(v2.home.aboutText),
    lessonsTitle: str(v2.home.lessonsTitle),
    lessonsText: txt(v2.home.lessonsText),
    testimonials,
  });

  /* Over ons */
  await draft("aboutPage", {
    "hero.subtitle": txt(v2.about.heroSubtitle),
    driveTitle: str(v2.about.driveTitle),
    driveText: txt(v2.about.driveText),
    values: v2.about.values.map((v) => ({ _key: key(), _type: "value", title: str(v.title), text: txt(v.text) })),
    collaboratorsTitle: str(v2.about.collaboratorsTitle),
    collaboratorsIntro: txt(v2.about.collaboratorsIntro),
  });

  /* people: bios, new collaborators */
  const people = await client.fetch<{ _id: string; name: string }[]>(`*[_type == "person" && !(_id in path("drafts.**"))]{ _id, name }`);
  const allNames = await client.fetch<string[]>(`*[_type == "person"].name`, {}, { perspective: "raw" }); // incl. draft-only people
  for (const [name, bio] of Object.entries(v2.bios)) {
    const p = people.find((x) => x.name === name);
    if (p) await draft(p._id, { bio: blocks(bio), kind: "founder" });
    else log.push(`⚠ person ${name}: not found`);
  }
  for (const c of v2.collaborators)
    if (!allNames.some((n) => n?.trim().toLowerCase() === c.name.toLowerCase())) create({ _id: `drafts.${randomUUID()}`, _type: "person", name: c.name, kind: "collaborator", role: str(c.role) }, `person ${c.name} (bio, links and photo still to ask)`);

  /* lesson styles: texts + where */
  const studios = await client.fetch<{ _id: string; name: string }[]>(`*[_type == "studio" && !(_id in path("drafts.**"))]{ _id, name }`);
  const classes = await client.fetch<{ _id: string; slug: string }[]>(`*[_type == "yogaClass" && !(_id in path("drafts.**"))]{ _id, "slug": slug.current }`);
  for (const [slug, s] of Object.entries(v2.styles)) {
    const c = classes.find((x) => x.slug === slug);
    if (!c) {
      log.push(`⚠ style ${slug}: not found`);
      continue;
    }
    const at = s.studios.map((n) => studios.find((x) => x.name === n)?._id).filter(Boolean) as string[];
    await draft(c._id, { ...(s.what ? { what: txt(s.what) } : {}), studios: at.map((id) => ({ _key: key(), ...ref(id) })) });
  }

  /* Lessen › Privéles (the photo came over from the Coaching page in migrate-v2) */
  await draft("lessonsPage", {
    "private.title": str(v2.privateLesson.title),
    "private.text": txt(v2.privateLesson.text),
    "private.practical": str(v2.privateLesson.practical),
    "private.button": str(v2.privateLesson.button),
  });

  /* Contact: coaching → privéles */
  await draft("contactPage", { intro: txt(v2.contact.intro), subjects: lines(v2.contact.subjects.nl, v2.contact.subjects.en) });

  /* sign-up forms (drafts) */
  const existingForms = await client.fetch<{ _id: string; name: string }[]>(`*[_type == "signupForm"]{ _id, name }`);
  const formIds: Record<string, string> = {};
  for (const f of v2.signupForms) {
    const found = existingForms.find((x) => x.name === f.name);
    formIds[f.key] = found?._id.replace(/^drafts\./, "") ?? randomUUID();
    if (found) continue;
    create(
      {
        _id: `drafts.${formIds[f.key]}`,
        _type: "signupForm",
        name: f.name,
        isDefault: f.isDefault,
        standard: { phone: true, room: true, diet: true },
        message: true,
        questions: f.questions.map((q) => ({
          _key: key(),
          _type: "signupQuestion",
          label: str(q.label),
          ...(q.help ? { help: str(q.help) } : {}),
          type: q.type,
          ...(q.options ? { options: lines(q.options.nl, q.options.en) } : {}),
          required: q.required,
        })),
      },
      `sign-up form “${f.name}”`,
    );
  }

  /* retreats: Eifel max 10, Dahab → the freediving form, new Rochefort (max 9) */
  const retreats = await client.fetch<{ _id: string; slug?: string; capacity?: number }[]>(
    `*[_type == "retreat" && !(_id in path("drafts.**")) && dateTime(endDate + "T23:59:59Z") >= dateTime(now())]{ _id, "slug": slug.current, capacity }`,
  );
  for (const r of retreats) {
    if (r.slug?.startsWith("eifel") && r.capacity !== 10) await draft(r._id, { capacity: 10 });
    if (r.slug?.startsWith("dahab")) await draft(r._id, { signupForm: draftRef(formIds.freediving, "signupForm") });
  }
  const rochefort = await client.fetch<number>(`count(*[_type == "retreat" && slug.current match "rochefort*"])`);
  if (!rochefort)
    create(
      { _id: `drafts.${randomUUID()}`, _type: "retreat", title: str({ nl: "Rochefort" }), slug: { _type: "slug", current: "rochefort" }, capacity: 9, place: str({ nl: "Rochefort" }), country: str({ nl: "België", en: "Belgium" }) },
      "retreat Rochefort (dates, venue, prices, programme, photos still to ask)",
    );

  /* legal pages: terms, cancellation, cookies (privacy moved over in migrate-v2) */
  const today = new Date().toISOString().slice(0, 10);
  for (const [route, page] of Object.entries(v2.legal)) {
    const id = `legal-${route}`;
    if (await client.getDocument(id)) continue;
    create(
      {
        _id: `drafts.${id}`,
        _type: "legalPage",
        title: str(page.title),
        intro: txt(page.intro),
        sections: page.sections.map((s) => ({ _key: key(), _type: "legalSection", title: str(s.title), text: txt(s.text) })),
        updatedAt: today,
      },
      nlDict.legal.titles[route as keyof typeof nlDict.legal.titles],
    );
  }

  console.log(log.join("\n"));
  if (DRY) return console.log(`\nDRY RUN: ${log.length} changes, nothing written.`);
  await tx.commit();
  console.log(`\nDone: ${log.length} drafts. Review them in the Studio (Live preview) and publish.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
