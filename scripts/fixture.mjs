/**
 * Offline fixture: the seed content as a local dataset, for building and
 * screenshotting the site without Sanity API access.
 *
 *   npm run fixture                    # → .fixture/dataset.json + public/__fixture/*.jpg
 *   SANITY_FIXTURE=1 npm run build     # sanityFetch now queries the fixture (groq-js)
 *
 * Both outputs are gitignored. Never set SANITY_FIXTURE in production.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, ".fixture/dataset.json");
const pub = path.join(root, "public/__fixture");
mkdirSync(path.dirname(out), { recursive: true });
mkdirSync(pub, { recursive: true });

execFileSync("npx", ["sanity", "exec", "scripts/seed.ts", "--", "--dry", `--out=${out}`], { cwd: path.join(root, "studio"), stdio: "inherit" });

const { docs, assets } = JSON.parse(readFileSync(out, "utf8"));
const now = new Date().toISOString();
const assetDocs = assets.map(({ _id, file }, i) => {
  const name = `${i}-${path.basename(file).replace(/[^\w.-]+/g, "-")}`;
  copyFileSync(path.join(root, file), path.join(pub, name));
  const { width, height } = imageSize(readFileSync(path.join(root, file)));
  return { _id, _type: "sanity.imageAsset", url: `/__fixture/${name}`, metadata: { lqip: null, dimensions: { width, height, aspectRatio: width / height } } };
});
const all = [...docs, ...assetDocs].map((d, i) => ({ _createdAt: new Date(Date.parse(now) - i * 1000).toISOString(), ...d }));
writeFileSync(out, JSON.stringify(all));
console.log(`Fixture: ${all.length} documents (${assetDocs.length} images) → ${path.relative(root, out)}`);
