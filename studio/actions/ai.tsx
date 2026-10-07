import { SparklesIcon } from "@sanity/icons/Sparkles";
import { useToast } from "@sanity/ui/toast";
import { useState } from "react";
import { useClient, useDocumentOperation, type DocumentActionComponent } from "sanity";
import { randomKey } from "@sanity/util/content";
import { apiVersion } from "../../sanity/site.config";
import { ai, findJobs, imageUrl, patchesFor } from "../lib/ai";

type I18nItem = { _key: string; _type?: string; language?: string; value?: unknown };
type Doc = Record<string, unknown> & { image?: { asset?: { _ref?: string } }; alt?: I18nItem[]; title?: I18nItem[]; place?: I18nItem[] };

const nl = (items?: I18nItem[]) => items?.find((i) => i.language === "nl")?.value as string | undefined;

/** Patches that fill a localized string field per language, only where it's still empty. */
function fillI18n(field: string, current: I18nItem[] | undefined, values: Record<string, string>, type = "internationalizedArrayStringValue") {
  const ops: Record<string, unknown>[] = [];
  if (!current) ops.push({ setIfMissing: { [field]: [] } });
  for (const [language, value] of Object.entries(values)) {
    const item = current?.find((i) => i.language === language);
    if (item && typeof item.value === "string" && item.value.trim()) continue;
    if (item) ops.push({ set: { [`${field}[_key=="${item._key}"].value`]: value } });
    else ops.push({ insert: { after: `${field}[-1]`, items: [{ _key: randomKey(12), _type: type, language, value }] } });
  }
  return ops;
}

/** Fotobank → ✨ Alt-tekst: Gemini looks at the photo and fills empty alt text + title (NL & EN) in the draft. */
export const altTextAction: DocumentActionComponent = ({ id, type, draft, published }) => {
  const doc = (draft ?? published) as Doc | null;
  const client = useClient({ apiVersion });
  const { patch } = useDocumentOperation(id, type);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const ref = doc?.image?.asset?._ref;
  const { projectId, dataset } = client.config();
  return {
    label: busy ? "Bezig…" : "✨ Alt-tekst genereren",
    icon: SparklesIcon,
    disabled: busy || !ref,
    title: ref ? "Vult lege alt-tekst en titel (NL + EN) in met AI. Controleer en publiceer daarna." : "Upload eerst een foto",
    onHandle: async () => {
      if (!ref || !doc) return;
      setBusy(true);
      try {
        const out = await ai<{ alt: Record<string, string>; title: Record<string, string> }>(client, { task: "alt", image: imageUrl(ref, projectId!, dataset!), context: nl(doc.place) });
        const ops = [...fillI18n("alt", doc.alt, out.alt), ...fillI18n("title", doc.title, out.title)];
        if (!ops.length) toast.push({ status: "info", title: "Alt-tekst en titel waren al ingevuld" });
        else {
          patch.execute(ops as never);
          toast.push({ status: "success", title: "Alt-tekst ingevuld", description: `${out.alt.nl} / ${out.alt.en}` });
        }
      } catch (err) {
        toast.push({ status: "error", title: "AI niet gelukt", description: String(err instanceof Error ? err.message : err) });
      } finally {
        setBusy(false);
      }
    },
  };
};

/** ✨ Vertaal NL → EN: every localized field with Dutch text and no English yet, translated into the draft. */
export const translateAction: DocumentActionComponent = ({ id, type, draft, published }) => {
  const doc = (draft ?? published) as Doc | null;
  const client = useClient({ apiVersion });
  const { patch } = useDocumentOperation(id, type);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const jobs = doc ? findJobs(doc) : [];
  return {
    label: busy ? "Bezig met vertalen…" : `✨ Vertaal NL → EN${jobs.length ? ` (${jobs.length})` : ""}`,
    icon: SparklesIcon,
    disabled: busy || !jobs.length,
    title: jobs.length ? "Vult de lege Engelse velden in met een AI-vertaling. Controleer en publiceer daarna." : "Alle Nederlandse teksten hebben al een Engelse versie",
    onHandle: async () => {
      if (!jobs.length) return;
      setBusy(true);
      try {
        // one request: flatten every job's texts under "<job index>|<key>"
        const texts = Object.fromEntries(jobs.flatMap((j, i) => Object.entries(j.texts).map(([k, v]) => [`${i}|${k}`, v])));
        const { texts: out } = await ai<{ texts: Record<string, string> }>(client, { task: "translate", texts, from: "nl", to: "en" });
        const results = jobs.map((_, i) => Object.fromEntries(Object.entries(out).filter(([k]) => k.startsWith(`${i}|`)).map(([k, v]) => [k.slice(String(i).length + 1), v])));
        patch.execute(patchesFor(jobs, results) as never);
        toast.push({ status: "success", title: `${jobs.length} ${jobs.length === 1 ? "veld" : "velden"} vertaald`, description: "Controleer de Engelse teksten en publiceer." });
      } catch (err) {
        toast.push({ status: "error", title: "Vertalen niet gelukt", description: String(err instanceof Error ? err.message : err) });
      } finally {
        setBusy(false);
      }
    },
  };
};
