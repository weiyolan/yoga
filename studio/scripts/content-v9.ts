/**
 * Content v9 → the live dataset: the same wording for the same question on every retreat form, so the
 * sign-ups table (Inschrijvingen → Tabel) gets one column per question instead of one per form.
 * - Forms (Formulieren → Inschrijfformulieren): label (NL + EN) and, for the experience levels and “how did
 *   you find us”, the options too. As DRAFTS: check and publish them.
 * - Existing sign-ups: the stored question text renamed the same way (their answers stay as they are).
 * - Then lists every question per form, so you can see what's still worded differently.
 *
 *   npx sanity exec scripts/content-v9.ts --with-user-token -- --dry   # prints what it would change
 *   npx sanity exec scripts/content-v9.ts --with-user-token
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
type I18n = { _key: string; _type: string; language: string; value?: string }[];
type Q = { _key: string; type?: string; label?: I18n; options?: I18n; other?: boolean; showIf?: string };
type Form = { _id: string; name?: string; questions?: Q[] };

const key = () => randomUUID().replace(/-/g, "").slice(0, 12);
const i18n = (kind: "String" | "Text", v: Tr): I18n =>
  Object.entries(v).map(([language, value]) => ({ _key: key(), _type: `internationalizedArray${kind}Value`, language, value }));
const nl = (v?: I18n) => v?.find((x) => x.language === "nl")?.value?.trim() ?? "";

const LEVELS = { nl: ["Nog nooit gedaan", "Beginner", "Gemiddeld", "Gevorderd"], en: ["Never done it", "Beginner", "Intermediate", "Advanced"] };
const FOUND = {
  nl: ["Instagram", "Facebook", "Via vrienden of familie", "Via Rita of Philippe"],
  en: ["Instagram", "Facebook", "Through friends or family", "Through Rita or Philippe"],
};

/** Topic of a question (by its Dutch text) → the one wording. `options` replaces the choices; `other` adds “Andere: …”. */
const RULES: { test: (label: string, type?: string) => boolean; label: Tr; options?: { nl: string[]; en: string[] }; other?: boolean }[] = [
  { test: (l) => /pilates/i.test(l) && /ervaring/i.test(l), label: { nl: "Mijn ervaring met Pilates", en: "My Pilates experience" }, options: LEVELS },
  { test: (l) => /(vrijduik|freediv)/i.test(l) && /ervaring/i.test(l), label: { nl: "Mijn ervaring met freediving", en: "My freediving experience" } },
  { test: (l) => /yoga/i.test(l) && /ervaring/i.test(l), label: { nl: "Mijn ervaring met yoga", en: "My yoga experience" }, options: LEVELS },
  { test: (l) => /^hoe heb je .*(gevonden|gehoord)/i.test(l), label: { nl: "Hoe heb je ons gevonden?", en: "How did you find us?" }, options: FOUND, other: true },
  {
    test: (l, t) => t !== "diet" && /(medische|blessures|fysieke aandachtspunten)/i.test(l),
    label: { nl: "Zijn er blessures, fysieke aandachtspunten of medische zaken waar we rekening mee moeten houden?", en: "Any injuries, physical or medical matters we should take into account?" },
  },
  {
    test: (l) => /aangenaam mogelijk/i.test(l),
    label: { nl: "Is er nog iets dat we mogen weten om jouw ervaring zo aangenaam mogelijk te maken?", en: "Is there anything else we should know to make your experience as pleasant as possible?" },
  },
];
const ruleFor = (label: string, type?: string) => (type === "section" ? undefined : RULES.find((r) => r.test(label, type)));
const label = (s: string) => s.trim().replace(/[:：]+$/, "");

async function main() {
  const forms = await client.fetch<Form[]>(`*[_type == "signupForm" && !(_id in path("drafts.**"))]{ _id, name, questions }`);
  const drafts = new Map((await client.fetch<Form[]>(`*[_type == "signupForm" && _id in path("drafts.**")]{ _id, name, questions }`)).map((d) => [d._id, d]));
  const tx = client.transaction();
  let n = 0;

  for (const published of forms) {
    const draftId = `drafts.${published._id}`;
    const form = drafts.get(draftId) ?? published; // an open draft: change that one, keep its other edits
    const changes: string[] = [];
    const questions = (form.questions ?? []).map((q) => {
      const r = ruleFor(nl(q.label), q.type);
      if (!r) return q;
      const next: Q = { ...q, label: i18n("String", r.label) };
      if (r.options && (q.type === "choice" || q.type === "multi")) {
        next.options = i18n("Text", { nl: r.options.nl.join("\n"), en: r.options.en.join("\n") });
        if (r.other) next.other = true;
      }
      const same = nl(q.label) === r.label.nl && (!r.options || nl(q.options) === r.options.nl.join("\n"));
      if (!same) changes.push(`  “${nl(q.label)}” → “${r.label.nl}”${r.options && next.options !== q.options ? ` · keuzes: ${r.options.nl.join(" / ")}${r.other ? " / Andere: …" : ""}` : ""}`);
      return next;
    });
    // a “show only if …” that names an old choice of a changed question would stop working: warn
    for (const [i, q] of questions.entries()) {
      const prev = (form.questions ?? [])[i - 1];
      const prevNew = questions[i - 1];
      if (q.showIf?.trim() && prev && nl(prev.options) !== nl(prevNew?.options))
        changes.push(`  ⚠ “${nl(q.label)}” toont enkel als de vorige vraag “${q.showIf.replace(/\n/g, " / ")}” is: kijk die voorwaarde na (de keuzes ervoor veranderden)`);
    }
    if (!changes.length) continue;
    console.log(`${published.name ?? published._id}${drafts.has(draftId) ? " (bestaand concept)" : ""}:\n${changes.join("\n")}`);
    if (drafts.has(draftId)) tx.patch(draftId, (p) => p.set({ questions }));
    else tx.createOrReplace({ ...(await client.getDocument(published._id))!, _id: draftId, questions });
    n++;
  }

  // existing sign-ups: same question text, so old and new answers share a column
  const signups = await client.fetch<{ _id: string; answers?: { _key: string; question?: string; answer?: string }[] }[]>(
    `*[_type == "signup" && count(answers) > 0]{ _id, answers }`,
  );
  let renamed = 0;
  for (const s of signups) {
    let changed = false;
    const answers = (s.answers ?? []).map((a) => {
      const r = ruleFor(a.question ?? "");
      if (!r || label(a.question ?? "") === label(r.label.nl)) return a;
      changed = true;
      return { ...a, question: r.label.nl };
    });
    if (!changed) continue;
    tx.patch(s._id, (p) => p.set({ answers }));
    renamed++;
  }
  if (renamed) console.log(`\nInschrijvingen: vraagtekst gelijkgetrokken in ${renamed} inschrijving(en) (antwoorden blijven).`);

  // what's left: every question, per form, so differences stand out
  console.log("\nAlle vragen (na deze wijziging):");
  const all = new Map<string, string[]>();
  for (const f of forms) {
    const form = drafts.get(`drafts.${f._id}`) ?? f;
    for (const q of form.questions ?? []) {
      if (q.type === "section" || q.type === "diet" || q.type === "room") continue; // diet / room: own columns anyway
      const r = ruleFor(nl(q.label), q.type);
      const l = label(r ? r.label.nl : nl(q.label));
      all.set(l, [...(all.get(l) ?? []), f.name ?? f._id]);
    }
  }
  for (const [l, fs] of [...all].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])))
    console.log(`  ${fs.length > 1 ? "✓" : "·"} ${l}  — ${fs.join(", ")}`);

  if (!n && !renamed) return console.log("\nNiets te veranderen.");
  if (DRY) return console.log(`\n--dry: ${n} formulier(en) en ${renamed} inschrijving(en) niet bewaard.`);
  await tx.commit();
  console.log(`\nKlaar: ${n} formulier(en) als concept (Formulieren → Inschrijfformulieren → Publiceren), ${renamed} inschrijving(en) bijgewerkt.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
