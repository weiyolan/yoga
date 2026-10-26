import { Badge, Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { useCallback, useEffect, useState } from "react";
import { useClient } from "sanity";
import { IntentLink } from "sanity/router";
import { apiVersion, defaultLanguage } from "../../sanity/site.config";
import { placeholders } from "../lib/placeholders";
import { FORM_TYPES } from "../schemaTypes";

type Doc = { _id: string; _type: string; name?: string; title?: { language?: string; value?: unknown }[] | string; [k: string]: unknown };
type Row = { id: string; type: string; title: string; draft: boolean; found: string[] };

const SKIP = [...FORM_TYPES, "aiTicket", "sanity.imageAsset", "sanity.fileAsset"];
const titleOf = (d: Doc) => {
  if (d.name) return d.name;
  if (typeof d.title === "string") return d.title;
  const t = d.title?.find((x) => x.language === defaultLanguage) ?? d.title?.[0];
  return typeof t?.value === "string" ? t.value : d._type;
};

/**
 * “Nog in te vullen”: every page or document with text in [brackets] (e.g. “[IBAN]”), the draft if
 * there is one. Click → the document; the fields themselves show a yellow warning.
 */
export function Placeholders() {
  const client = useClient({ apiVersion });
  const [rows, setRows] = useState<Row[] | null>(null);
  const [scanned, setScanned] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    // Every document incl. drafts; private ids (signup.<uuid>, …) are skipped below.
    const all = await client.fetch<Doc[]>(`*[!(_type in $skip)]`, { skip: SKIP }, { perspective: "raw" });
    const docs = all.filter((d) => d._id.startsWith("drafts.") || !d._id.includes("."));
    setScanned(new Set(docs.map((d) => d._id.replace(/^drafts\./, ""))).size);
    const byId = new Map<string, Doc>();
    for (const d of docs) {
      const id = d._id.replace(/^drafts\./, "");
      if (d._id.startsWith("drafts.") || !byId.has(id)) byId.set(id, d);
    }
    setRows(
      [...byId.entries()]
        .map(([id, d]) => ({ id, type: d._type, title: titleOf(d), draft: d._id.startsWith("drafts."), found: placeholders(d) }))
        .filter((r) => r.found.length)
        .sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title)),
    );
  }, [client]);
  const run = useCallback(
    () =>
      load().catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setRows([]);
      }),
    [load],
  );
  useEffect(() => void run(), [run]);

  return (
    <Box padding={4} style={{ maxWidth: 760 }}>
      <Stack gap={4}>
        <Text size={1} muted>
          Tekst tussen [haken] moet nog ingevuld worden. In het document zelf staat bij die velden een gele waarschuwing.
        </Text>
        {error ? (
          <Card padding={3} radius={2} tone="critical" border>
            <Text size={1}>Zoeken mislukt: {error}</Text>
          </Card>
        ) : rows === null ? (
          <Text size={1} muted>Zoeken…</Text>
        ) : (
          <Text size={1} muted>
            {scanned} documenten doorzocht{rows.length ? `, ${rows.length} met tekst tussen [haken]:` : ". Alles ingevuld. 🎉"}
          </Text>
        )}
        {rows?.map((r) => (
          <Card key={r.id} padding={3} radius={2} border>
            <Stack gap={3}>
              <Flex gap={2} align="center">
                <Text size={1} weight="semibold">
                  <IntentLink intent="edit" params={{ id: r.id, type: r.type }}>
                    {r.title}
                  </IntentLink>
                </Text>
                {r.draft ? <Badge tone="caution">concept</Badge> : null}
              </Flex>
              <Flex gap={2} wrap="wrap">
                {r.found.map((p) => (
                  <Badge key={p} tone="caution">
                    {p}
                  </Badge>
                ))}
              </Flex>
            </Stack>
          </Card>
        ))}
        <Box>
          <Button mode="ghost" text="Opnieuw zoeken" onClick={() => void run()} />
        </Box>
      </Stack>
    </Box>
  );
}
