import { SparklesIcon } from "@sanity/icons/Sparkles";
import { Box, Button, Card, Checkbox, Flex, Select, Stack, Text } from "@sanity/ui";
import { randomKey } from "@sanity/util/content";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useClient, useSchema } from "sanity";
import { IntentLink } from "sanity/router";
import { apiVersion, defaultLanguage } from "../../sanity/site.config";
import { findJobs, translatedValue, translateJobs, type Job } from "../lib/ai";
import { FORM_TYPES } from "../schemaTypes";

type Doc = { _id: string; _type: string; name?: string; title?: unknown; [k: string]: unknown };
type Row = { id: string; type: string; title: string; doc: Doc; draft: boolean; missing: number; all: number };

const SKIP = [...FORM_TYPES, "aiTicket", "sanity.imageAsset", "sanity.fileAsset"];
const titleOf = (d: Doc): string | undefined => {
  if (typeof d.name === "string") return d.name;
  const t = d.title as { language?: string; value?: unknown }[] | string | undefined;
  if (typeof t === "string") return t;
  const v = t?.find((x) => x.language === defaultLanguage)?.value ?? t?.[0]?.value;
  return typeof v === "string" ? v : undefined;
};

/**
 * Vertalen (AI): every document with Dutch text and missing English, per type. Tick documents →
 * NL → EN for all their localized fields (only the empty English ones, or everything with
 * “overschrijven”). Results go into each document's draft: check them and publish.
 */
export function BulkTranslate() {
  const client = useClient({ apiVersion });
  const schema = useSchema();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [type, setType] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const load = useCallback(async () => {
    setRows(null);
    const all = await client.fetch<Doc[]>(`*[!(_type in $skip)]`, { skip: SKIP }, { perspective: "raw" });
    const byId = new Map<string, Doc>();
    for (const d of all.filter((d) => d._id.startsWith("drafts.") || !d._id.includes("."))) {
      const id = d._id.replace(/^drafts\./, "");
      if (d._id.startsWith("drafts.") || !byId.has(id)) byId.set(id, d);
    }
    setRows(
      [...byId.entries()]
        // singletons (Home, Algemeen, …) have no title field: their type's name
        .map(([id, doc]) => ({ id, type: doc._type, title: titleOf(doc) ?? schema.get(doc._type)?.title ?? id, doc, draft: doc._id.startsWith("drafts."), missing: findJobs(doc).length, all: findJobs(doc, defaultLanguage, "en", true).length }))
        .filter((r) => r.all > 0)
        .sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title)),
    );
  }, [client, schema]);
  useEffect(() => void load().catch(console.error), [load]);

  const typeTitle = (t: string) => schema.get(t)?.title ?? t;
  const types = useMemo(() => [...new Set(rows?.map((r) => r.type) ?? [])], [rows]);
  const shown = (rows ?? []).filter((r) => (!type || r.type === type) && (overwrite || r.missing > 0));
  const selected = shown.filter((r) => picked.has(r.id));
  const toggle = (id: string) => setPicked((p) => (p.has(id) ? new Set([...p].filter((x) => x !== id)) : new Set([...p, id])));

  const run = async () => {
    setBusy(true);
    setLog([]);
    for (const r of selected) {
      const jobs: Job[] = findJobs(r.doc, defaultLanguage, "en", overwrite);
      if (!jobs.length) continue;
      try {
        // in chunks, so one request never gets too big
        const results: Record<string, string>[] = [];
        for (let i = 0; i < jobs.length; i += 25) results.push(...(await translateJobs(client, jobs.slice(i, i + 25))));
        const draftId = `drafts.${r.id}`;
        if (!r.draft) {
          const { _rev, _createdAt, _updatedAt, ...doc } = r.doc as Doc & { _rev?: string; _createdAt?: string; _updatedAt?: string };
          void _rev, void _createdAt, void _updatedAt;
          await client.createIfNotExists({ ...doc, _id: draftId });
        }
        let patch = client.patch(draftId);
        jobs.forEach((job, i) => {
          const value = translatedValue(job, results[i]);
          patch = job.en
            ? patch.set({ [`${job.path}[_key=="${job.en._key}"].value`]: value })
            : patch.insert("after", `${job.path}[_key=="${job.nl._key}"]`, [{ _key: randomKey(12), _type: job.nl._type, language: "en", value }]);
        });
        await patch.commit();
        setLog((l) => [...l, `✓ ${typeTitle(r.type)} · ${r.title}: ${jobs.length} velden`]);
      } catch (err) {
        setLog((l) => [...l, `✗ ${typeTitle(r.type)} · ${r.title}: ${err instanceof Error ? err.message : String(err)}`]);
      }
    }
    setBusy(false);
    setPicked(new Set());
    void load();
  };

  return (
    <Box padding={4} style={{ maxWidth: 820 }}>
      <Stack gap={4}>
        <Text size={1} muted>
          Vertaalt de Nederlandse teksten naar het Engels met AI. Standaard enkel lege Engelse velden. Het resultaat komt in het concept van elk document: kijk het na en publiceer.
        </Text>
        <Flex gap={3} align="center" wrap="wrap">
          <Select value={type} onChange={(e) => setType(e.currentTarget.value)} style={{ minWidth: 220 }}>
            <option value="">Alle soorten</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {typeTitle(t)}
              </option>
            ))}
          </Select>
          <Flex as="label" gap={2} align="center">
            <Checkbox checked={overwrite} onChange={() => setOverwrite((o) => !o)} />
            <Text size={1}>Ook bestaand Engels overschrijven</Text>
          </Flex>
        </Flex>
        {rows === null ? <Text size={1} muted>Zoeken…</Text> : !shown.length ? <Text size={1}>Niets te vertalen. 🎉</Text> : null}
        {shown.length ? (
          <Flex as="label" gap={2} align="center">
            <Checkbox checked={selected.length === shown.length} onChange={() => setPicked(selected.length === shown.length ? new Set() : new Set(shown.map((r) => r.id)))} />
            <Text size={1} weight="semibold">
              Alles selecteren ({shown.length})
            </Text>
          </Flex>
        ) : null}
        <Stack gap={2}>
          {shown.map((r) => (
            <Card key={r.id} padding={3} radius={2} border>
              <Flex gap={3} align="center">
                <Checkbox checked={picked.has(r.id)} onChange={() => toggle(r.id)} />
                <Box flex={1}>
                  <Text size={1}>
                    <IntentLink intent="edit" params={{ id: r.id, type: r.type }}>
                      {r.title}
                    </IntentLink>
                  </Text>
                </Box>
                <Text size={1} muted>
                  {typeTitle(r.type)} · {overwrite ? `${r.all} velden` : `${r.missing} zonder Engels`}
                </Text>
              </Flex>
            </Card>
          ))}
        </Stack>
        <Box>
          <Button icon={SparklesIcon} tone="primary" text={busy ? "Bezig met vertalen…" : `Vertaal ${selected.length || ""} ${selected.length === 1 ? "document" : "documenten"}`} disabled={busy || !selected.length} onClick={run} />
        </Box>
        {log.length ? (
          <Card padding={3} radius={2} tone="transparent" border>
            <Stack gap={2}>
              {log.map((l, i) => (
                <Text key={i} size={1}>
                  {l}
                </Text>
              ))}
            </Stack>
          </Card>
        ) : null}
      </Stack>
    </Box>
  );
}
