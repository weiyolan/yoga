/**
 * Content v8 → the live dataset (published right away, plus any open draft): mail addresses.
 * - Mails → Opties → “Meldingen naar”: Rita + Philippe (form notifications + what contact@ forwards).
 * - Contact → E-mail (site, footer, mails): contact@yogazentonic.com.
 * - Rita's personal address in public texts (sign-up form intros, FAQ, mails, …) → contact@yogazentonic.com.
 * Run only once contact@ forwarding works (README → Mail forwarding), else mail to it goes nowhere.
 *
 *   npx sanity exec scripts/content-v8.ts --with-user-token -- --dry   # prints what it would change
 *   npx sanity exec scripts/content-v8.ts --with-user-token
 */
import { existsSync } from "node:fs";
import { getCliClient } from "sanity/cli";
import { apiVersion } from "../../sanity/site.config.ts";

const DRY = process.argv.includes("--dry");
if (existsSync(".env")) process.loadEnvFile(".env");
const token = process.env.SANITY_AUTH_TOKEN || undefined;
const client = getCliClient({ apiVersion, ...(token ? { token } : {}) });

const NOTIFY = "rita.huysmans44@gmail.com, pweiler1000@gmail.com";
const SITE = "contact@yogazentonic.com";
const PERSONAL = "rita.huysmans44@gmail.com";
/** Public content that may mention an address (never submissions, subscribers or Mails → Opties). */
const TYPES = ["signupForm", "contactPage", "settings", "retreat", "faqPage", "confirmationMail", "newsletterMail", "newsletter", "aboutPage", "homePage", "lessonsPage", "legalPage", "privacyPage"];

type Doc = { _id: string; _type: string; [k: string]: unknown };

/** Every string in `v` with PERSONAL → SITE; `paths` collects where. */
function swap(v: unknown, path: string, paths: string[]): unknown {
  if (typeof v === "string") {
    if (!v.includes(PERSONAL)) return v;
    paths.push(path);
    return v.replaceAll(PERSONAL, SITE);
  }
  if (Array.isArray(v)) return v.map((x, i) => swap(x, `${path}[${i}]`, paths));
  if (v && typeof v === "object")
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k.startsWith("_") ? x : swap(x, path ? `${path}.${k}` : k, paths)]));
  return v;
}

async function main() {
  const tx = client.transaction();
  let n = 0;

  // 1. Meldingen naar (published + draft)
  const mail = await client.fetch<Doc[]>(`*[_id in ["mailSettings", "drafts.mailSettings"]]`);
  if (!mail.some((d) => d._id === "mailSettings")) {
    tx.createIfNotExists({ _id: "mailSettings", _type: "mailSettings" });
    mail.push({ _id: "mailSettings", _type: "mailSettings" });
  }
  for (const d of mail) {
    console.log(`${d._id}: Meldingen naar "${d.notifyEmail ?? ""}" → "${NOTIFY}"`);
    tx.patch(d._id, (p) => p.set({ notifyEmail: NOTIFY }));
    n++;
  }

  // 2. the site's e-mail (Contact page)
  const contact = await client.fetch<Doc[]>(`*[_id in ["contactPage", "drafts.contactPage"]]`);
  if (!contact.length) console.warn("contactPage not found: set Contact → E-mail by hand");
  for (const d of contact) {
    console.log(`${d._id}: E-mail "${d.email ?? ""}" → "${SITE}"`);
    tx.patch(d._id, (p) => p.set({ email: SITE }));
    n++;
  }

  // 3. Rita's personal address in public texts
  const docs = await client.fetch<Doc[]>(`*[_type in $types]`, { types: TYPES });
  for (const d of docs) {
    const paths: string[] = [];
    const next = swap(d, "", paths) as Doc;
    const fields = Object.fromEntries(Object.entries(next).filter(([k]) => !k.startsWith("_") && paths.some((p) => p === k || p.startsWith(`${k}.`) || p.startsWith(`${k}[`))));
    if (d._type === "contactPage") delete fields.email;
    if (!Object.keys(fields).length) continue;
    console.log(`${d._id} (${d._type}): ${PERSONAL} → ${SITE} in ${paths.join(", ")}`);
    tx.patch(d._id, (p) => p.set(fields));
    n++;
  }

  if (!n) return console.log("Nothing to change.");
  if (DRY) return console.log(`\n--dry: ${n} change(s) not saved.`);
  await tx.commit();
  console.log(`\nDone: ${n} change(s), live right away.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
