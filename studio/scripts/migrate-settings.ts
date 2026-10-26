/**
 * Instellingen is split up (Studio):
 *  - Algemeen (`settings`): keeps site name, slogan, default SEO.
 *  - Contact page: email, phone, instagram, facebook (Contact & social) + contactThanks.
 *  - Menu & footer (`navigation`): menu* texts + newsletterTitle, newsletterThanks.
 *  - Formulieren → Inschrijving (`signupSettings`): signupConsent, signupTerms, signupThanks.
 *  - Mails → Opties (`mailSettings`): autoConfirm, notifyEmail (from Instellingen or Formulieren → Inschrijving).
 * Published Instellingen → the published targets; an Instellingen draft → drafts of the targets.
 * A value already set on the target is kept. Then the moved fields are unset on `settings`. Run once
 * after deploying the Studio; safe to run again.
 *
 *   npx sanity exec scripts/migrate-settings.ts --with-user-token -- --dry
 *   npx sanity exec scripts/migrate-settings.ts --with-user-token
 */
import { existsSync } from "node:fs";
import { getCliClient } from "sanity/cli";
import { apiVersion } from "../../sanity/site.config.ts";

const DRY = process.argv.includes("--dry");
if (existsSync(".env")) process.loadEnvFile(".env");
const token = process.env.SANITY_AUTH_TOKEN || undefined;
const client = getCliClient({ apiVersion, ...(token ? { token } : {}) });

type Doc = { _id: string; _type: string; [k: string]: unknown };
const MOVES: { from: string; id: string; type: string; fields: string[] }[] = [
  { from: "settings", id: "contactPage", type: "contactPage", fields: ["email", "phone", "instagram", "facebook", "contactThanks"] },
  { from: "settings", id: "navigation", type: "navigation", fields: ["menuFounders", "menuFoundersSub", "menuTeam", "menuDrive", "menuCollaborators", "menuUpcoming", "menuPast", "newsletterTitle", "newsletterThanks"] },
  { from: "settings", id: "signupSettings", type: "signupSettings", fields: ["signupConsent", "signupTerms", "signupThanks"] },
  // Mails → Opties: from the old Instellingen, or from Formulieren → Inschrijving (where they were briefly)
  { from: "settings", id: "mailSettings", type: "mailSettings", fields: ["autoConfirm", "notifyEmail"] },
  { from: "signupSettings", id: "mailSettings", type: "mailSettings", fields: ["autoConfirm", "notifyEmail"] },
];
const has = (v: unknown) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length);

async function run() {
  const sources = [...new Set(MOVES.map((m) => m.from))];
  const ids = [...new Set([...sources, ...MOVES.map((m) => m.id)])].flatMap((id) => [id, `drafts.${id}`]);
  const docs = new Map((await client.fetch<Doc[]>(`*[_id in $ids]`, { ids }, { perspective: "raw" })).map((d) => [d._id, d]));
  const tx = client.transaction();
  const log: string[] = [];

  for (const from of sources)
    for (const draft of [false, true]) {
      const src = docs.get(draft ? `drafts.${from}` : from);
      if (!src) continue;
      const moves = MOVES.filter((m) => m.from === from);
      for (const m of moves) {
        const set = Object.fromEntries(m.fields.filter((f) => has(src[f])).map((f) => [f, src[f]]));
        if (!Object.keys(set).length) continue;
        const targetId = draft ? `drafts.${m.id}` : m.id;
        const target = docs.get(targetId) ?? (draft ? docs.get(m.id) : undefined);
        const keep = Object.keys(set).filter((f) => has(docs.get(targetId)?.[f]));
        for (const f of keep) delete set[f];
        if (!Object.keys(set).length) continue;
        if (!docs.get(targetId)) {
          const doc = { ...(target ?? {}), _id: targetId, _type: m.type };
          tx.createIfNotExists(doc);
          docs.set(targetId, doc as Doc);
        }
        tx.patch(targetId, (p) => p.set(set));
        Object.assign(docs.get(targetId)!, set);
        log.push(`${targetId}: set ${Object.keys(set).join(", ")} (from ${src._id})${keep.length ? ` (kept existing ${keep.join(", ")})` : ""}`);
      }
      const unset = moves.flatMap((m) => m.fields).filter((f) => src[f] !== undefined);
      if (unset.length) {
        tx.patch(src._id, (p) => p.unset(unset));
        log.push(`${src._id}: unset ${unset.join(", ")}`);
      }
    }

  console.log(log.join("\n") || "Nothing to do.");
  if (DRY) return console.log("\n--dry: nothing written.");
  if (log.length) await tx.commit();
  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
