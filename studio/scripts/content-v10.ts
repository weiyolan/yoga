/**
 * Content v10: newsletters → “Onder de tekst”. The old “Retreats in de kijker” + “Knop: tekst/link”
 * become blocks there (retreat cards first, then the button: the same mail as before), in every version
 * (published + open draft). Only moves what's there; nothing is sent.
 *
 *   npx sanity exec scripts/content-v10.ts --with-user-token -- --dry   # prints what it would change
 *   npx sanity exec scripts/content-v10.ts --with-user-token
 */
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { getCliClient } from "sanity/cli";
import { apiVersion } from "../../sanity/site.config.ts";

const DRY = process.argv.includes("--dry");
if (existsSync(".env")) process.loadEnvFile(".env");
const token = process.env.SANITY_AUTH_TOKEN || undefined;
const client = getCliClient({ apiVersion, ...(token ? { token } : {}) });

type Ref = { _key?: string; _type: "reference"; _ref: string; _weak?: boolean; _strengthenOnPublish?: unknown };
type Doc = { _id: string; title?: string; blocks?: { _key: string }[]; retreats?: Ref[]; buttonLabel?: { _key: string; language?: string; value?: string }[]; buttonUrl?: string };

const key = () => randomUUID().replaceAll("-", "").slice(0, 12);

async function main() {
  const docs = await client.fetch<Doc[]>(`*[_type == "newsletter" && (count(retreats) > 0 || defined(buttonLabel) || defined(buttonUrl))]`);
  if (!docs.length) return console.log("Niets te doen: geen nieuwsbrief met oude retreats/knop.");
  const tx = client.transaction();
  for (const d of docs) {
    const blocks = [
      ...(d.retreats ?? []).map((r) => ({ ...r, _key: key() })),
      ...(d.buttonLabel?.some((l) => l.value) && d.buttonUrl ? [{ _key: key(), _type: "newsletterButton", label: d.buttonLabel, url: d.buttonUrl }] : []),
    ];
    console.log(`${d._id} (${d.title ?? "?"}): ${d.retreats?.length ?? 0} retreats${blocks.length > (d.retreats?.length ?? 0) ? " + knop" : ""} → Onder de tekst`);
    tx.patch(d._id, (p) => p.setIfMissing({ blocks: [] }).append("blocks", blocks).unset(["retreats", "buttonLabel", "buttonUrl"]));
  }
  if (DRY) return console.log(`\n--dry: ${docs.length} document(en), niets gewijzigd.`);
  await tx.commit();
  console.log(`\nKlaar: ${docs.length} document(en).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
