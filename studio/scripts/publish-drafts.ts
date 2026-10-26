/**
 * Publishes every draft (what “Publiceren” does in the Studio, via Sanity's publish action), e.g.
 * after content-v2 / content-v3. Lists the [placeholders] still in each draft first.
 *
 *   npx sanity exec scripts/publish-drafts.ts --with-user-token -- --dry                  # list only
 *   npx sanity exec scripts/publish-drafts.ts --with-user-token                           # publish all
 *   npx sanity exec scripts/publish-drafts.ts --with-user-token -- --skip-placeholders    # keep drafts with [..] as drafts
 *   npx sanity exec scripts/publish-drafts.ts --with-user-token -- --only=faqPage,retreat # only these types
 *
 * References to documents that were only a draft (`_strengthenOnPublish`) become normal references
 * once their target is published.
 */
import { existsSync } from "node:fs";
import { getCliClient } from "sanity/cli";
import { apiVersion } from "../../sanity/site.config.ts";
import { placeholders } from "../lib/placeholders.ts";

const DRY = process.argv.includes("--dry");
const SKIP_PLACEHOLDERS = process.argv.includes("--skip-placeholders");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",").filter(Boolean);
if (existsSync(".env")) process.loadEnvFile(".env");
const token = process.env.SANITY_AUTH_TOKEN || undefined;
const client = getCliClient({ apiVersion, ...(token ? { token } : {}) });

type Doc = { _id: string; _type: string; _rev: string; [k: string]: unknown };
type Ref = { _ref: string; _weak?: boolean; _strengthenOnPublish?: unknown };
const label = (d: Doc) => {
  const t = d.title as { language?: string; value?: unknown }[] | string | undefined;
  const v = typeof t === "string" ? t : t?.find((x) => x.language === "nl")?.value;
  return `${d._type} “${(d.name as string) ?? (typeof v === "string" ? v : d._id)}”`;
};

/** Paths of references still waiting for their target to be published. */
function weakRefs(v: unknown, path: (string | number | { _key: string })[] = [], out: { path: typeof path; ref: string }[] = []) {
  if (Array.isArray(v)) v.forEach((x, i) => weakRefs(x, [...path, x && typeof x === "object" && "_key" in x ? { _key: String((x as { _key: string })._key) } : i], out));
  else if (v && typeof v === "object") {
    const r = v as Ref;
    if (typeof r._ref === "string" && r._strengthenOnPublish) out.push({ path, ref: r._ref });
    else for (const [k, x] of Object.entries(v)) if (!k.startsWith("_")) weakRefs(x, [...path, k], out);
  }
  return out;
}
const pathString = (p: (string | number | { _key: string })[]) =>
  p.reduce<string>((s, x) => (typeof x === "string" ? (s ? `${s}.${x}` : x) : typeof x === "number" ? `${s}[${x}]` : `${s}[_key=="${x._key}"]`), "");

async function run() {
  const drafts = await client.fetch<Doc[]>(`*[_id in path("drafts.**")] | order(_type asc)`, {}, { perspective: "raw" });
  const chosen = drafts.filter((d) => !ONLY || ONLY.includes(d._type));
  const publish: Doc[] = [];
  for (const d of chosen) {
    const found = placeholders(d);
    const skip = SKIP_PLACEHOLDERS && found.length > 0;
    console.log(`${skip ? "skip   " : "publish"} ${label(d)}${found.length ? `  ⚠ nog in te vullen: ${found.join(", ")}` : ""}`);
    if (!skip) publish.push(d);
  }
  if (!publish.length) return console.log("\nNo drafts to publish.");
  if (DRY) return console.log(`\nDRY RUN: ${publish.length} drafts would be published, nothing written.`);

  // Publish in batches; each batch is one transaction.
  for (let i = 0; i < publish.length; i += 20)
    await client.action(
      publish.slice(i, i + 20).map((d) => ({ actionType: "sanity.action.document.publish" as const, draftId: d._id, publishedId: d._id.replace(/^drafts\./, ""), ifDraftRevisionId: d._rev })),
    );

  // Draft-only references → normal references, where the target is published now.
  const docs = await client.fetch<Doc[]>(`*[!(_id in path("drafts.**")) && _id in $ids]`, { ids: publish.map((d) => d._id.replace(/^drafts\./, "")) });
  const published = new Set(await client.fetch<string[]>(`*[!(_id in path("drafts.**"))]._id`));
  const tx = client.transaction();
  let fixed = 0;
  for (const d of docs)
    for (const { path, ref } of weakRefs(d))
      if (published.has(ref)) {
        tx.patch(d._id, (p) => p.unset([`${pathString(path)}._weak`, `${pathString(path)}._strengthenOnPublish`]));
        fixed++;
      }
  if (fixed) await tx.commit();
  console.log(`\nDone: ${publish.length} published${fixed ? `, ${fixed} references strengthened` : ""}.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
