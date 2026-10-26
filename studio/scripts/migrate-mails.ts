/**
 * Bevestigingsmails: the confirmation mail texts move from Instellingen → Formulieren to their own
 * documents (Studio → Bevestigingsmails), like the sign-up forms. Run once after deploying the Studio.
 *
 *   npx sanity exec scripts/migrate-mails.ts --with-user-token -- --dry   # prints what it would do
 *   npx sanity exec scripts/migrate-mails.ts --with-user-token            # applies it
 *
 *  - Creates the “Standaard” confirmation mail (published) from the texts in Instellingen (the draft
 *    if there is one); missing texts → the v2 texts / the built-in text. Skipped if one exists.
 *  - Unsets signupMail, paymentMail, waitlistMail and defaultSignupUrl on Instellingen (published + draft).
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

type I18n = { _key: string; _type: string; language: string; value: string };
const key = () => randomUUID().replace(/-/g, "").slice(0, 12);
const txt = (v: Record<string, string>) => Object.entries(v).map(([language, value]) => ({ _key: key(), _type: "internationalizedArrayTextValue", language, value }));
const filled = (v?: I18n[]) => (v?.some((i) => i.value?.trim()) ? v : undefined);
const FIELDS = ["signupMail", "paymentMail", "waitlistMail"];
/** Also dropped from Instellingen: the default external sign-up link. */
const UNSET = [...FIELDS, "defaultSignupUrl"];

async function run() {
  const log: string[] = [];
  const tx = client.transaction();
  const [published, draft] = await Promise.all([client.getDocument("settings"), client.getDocument("drafts.settings")]);
  const src = (f: string) => filled(draft?.[f] as I18n[] | undefined) ?? filled(published?.[f] as I18n[] | undefined);

  const existing = await client.fetch<number>(`count(*[_type == "confirmationMail" && isDefault == true])`);
  if (existing) log.push("confirmationMail: a standard mail exists, not created");
  else {
    const waitlist = Object.fromEntries((["nl", "en"] as const).map((l) => [l, getDictionary(l).signup.waitlistMailBody("{naam}", "{retreat}", "{datum}")]));
    const doc = {
      _id: randomUUID(),
      _type: "confirmationMail",
      name: "Standaard",
      isDefault: true,
      body: src("signupMail") ?? txt(v2.mails.signupMail),
      payment: src("paymentMail") ?? txt(v2.mails.paymentMail),
      waitlistBody: src("waitlistMail") ?? txt(waitlist),
    };
    tx.create(doc);
    log.push(`${doc._id}: create confirmationMail “Standaard” (${FIELDS.map((f) => `${f}: ${src(f) ? "from Instellingen" : "default text"}`).join(", ")})`);
  }
  for (const d of [published, draft]) {
    const unset = UNSET.filter((f) => d?.[f] !== undefined);
    if (d && unset.length) {
      tx.patch(d._id, (p) => p.unset(unset));
      log.push(`${d._id}: unset ${unset.join(", ")}`);
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
