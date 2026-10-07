import { randomKey } from "@sanity/util/content";
import type { useClient } from "sanity";
import { SITE_URL, siteOrigin } from "./site";

type Client = ReturnType<typeof useClient>;

/**
 * Calls the site's /api/ai (Gemini). The editor's own credentials create a one-off private
 * ticket document first; the route checks and deletes it (see app/api/ai/route.ts).
 */
export async function ai<T>(client: Client, body: Record<string, unknown>): Promise<T> {
  const ticket = `aiTicket.${randomKey(16)}`;
  await client.create({ _id: ticket, _type: "aiTicket" });
  // `sanity dev` (:3333) has no /api: use the live site
  const origin = typeof location !== "undefined" && location.port === "3333" ? SITE_URL : siteOrigin();
  const res = await fetch(`${origin}/api/ai`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, ticket }) });
  const json = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) {
    client.delete(ticket).catch(() => {});
    throw new Error(json.message || `AI-fout (${res.status})`);
  }
  return json;
}

/** `image-<hash>-<w>x<h>-<ext>` → the CDN url. */
export function imageUrl(ref: string, projectId: string, dataset: string) {
  const [, id, size, ext] = ref.split("-");
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${size}.${ext}`;
}

/* ---- internationalized arrays: find NL values without EN ---- */

type I18nItem = { _key: string; _type?: string; language?: string; value?: unknown };
type Block = { _type: string; _key: string; children?: { _type: string; _key: string; text?: string }[] };
export type Job = { path: string; nl: I18nItem; en?: I18nItem; texts: Record<string, string> };

const isI18nArray = (v: unknown): v is I18nItem[] => Array.isArray(v) && v.length > 0 && v.every((i) => i && typeof i === "object" && "language" in i && "_key" in i);
const empty = (v: unknown) => v === undefined || v === null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length);
const SKIP = new Set(["_id", "_type", "_rev", "_createdAt", "_updatedAt", "slug", "seo"]);

/** Every localized field with a Dutch value and an empty/missing English one (or all, with `overwrite`). */
export function findJobs(doc: Record<string, unknown>, from = "nl", to = "en", overwrite = false): Job[] {
  const jobs: Job[] = [];
  const walk = (value: unknown, path: string) => {
    if (isI18nArray(value)) {
      const nl = value.find((i) => i.language === from);
      const en = value.find((i) => i.language === to);
      if (!nl || empty(nl.value) || (!overwrite && en && !empty(en.value))) return;
      const texts: Record<string, string> = {};
      if (typeof nl.value === "string") texts.value = nl.value;
      else if (Array.isArray(nl.value))
        for (const b of nl.value as Block[]) for (const c of b.children ?? []) if (c.text?.trim()) texts[`${b._key}.${c._key}`] = c.text;
      if (Object.keys(texts).length) jobs.push({ path, nl, en, texts });
      return;
    }
    if (Array.isArray(value)) value.forEach((item, i) => walk(item, `${path}[${item && typeof item === "object" && "_key" in item ? `_key=="${(item as I18nItem)._key}"` : i}]`));
    else if (value && typeof value === "object")
      for (const [k, v] of Object.entries(value)) if (!SKIP.has(k) && !k.startsWith("_")) walk(v, path ? `${path}.${k}` : k);
  };
  walk(doc, "");
  return jobs;
}

/** The translated value for one job: a string, or the Dutch blocks with translated span texts. */
export function translatedValue(job: Job, out: Record<string, string>): unknown {
  if (typeof job.nl.value === "string") return out.value ?? job.nl.value;
  return (job.nl.value as Block[]).map((b) => ({
    ...b,
    _key: randomKey(12),
    children: b.children?.map((c) => ({ ...c, _key: randomKey(12), text: out[`${b._key}.${c._key}`] ?? c.text })),
  }));
}

/** Patch operations (for useDocumentOperation().patch) that write the translations. */
export function patchesFor(jobs: Job[], results: Record<string, string>[], to = "en") {
  return jobs.map((job, i) => {
    const value = translatedValue(job, results[i]);
    return job.en
      ? { set: { [`${job.path}[_key=="${job.en._key}"].value`]: value } }
      : { insert: { after: `${job.path}[_key=="${job.nl._key}"]`, items: [{ _key: randomKey(12), _type: job.nl._type, language: to, value }] } };
  });
}
