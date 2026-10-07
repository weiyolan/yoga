import { SparklesIcon } from "@sanity/icons/Sparkles";
import { Box, Button, Card, Stack, Text } from "@sanity/ui";
import { randomKey } from "@sanity/util/content";
import { useCallback, useEffect, useState } from "react";
import { useClient } from "sanity";
import { apiVersion } from "../../sanity/site.config";
import { ai, imageUrl } from "../lib/ai";

type Item = { _id: string; ref?: string; place?: string; alt?: { _key: string; language: string; value?: string }[]; title?: { _key: string; language: string; value?: string }[] };

const QUERY = `*[_type == "mediaItem" && defined(image.asset) && !defined(alt[language == "nl"][0].value) && !(_id in path("drafts.**"))]{
  _id, "ref": image.asset._ref, "place": place[language == "nl"][0].value, alt, title
}`;

/** Fotobank → ✨ Alt-teksten aanvullen: every photo without Dutch alt text gets NL + EN alt and title (published directly). */
export function BulkAltText() {
  const client = useClient({ apiVersion });
  const [items, setItems] = useState<Item[] | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => client.fetch<Item[]>(QUERY).then(setItems, console.error), [client]);
  useEffect(() => void load(), [load]);
  const { projectId, dataset } = client.config();

  const run = async () => {
    if (!items?.length) return;
    setBusy(true);
    setLog([]);
    for (const item of items) {
      if (!item.ref) continue;
      try {
        const out = await ai<{ alt: Record<string, string>; title: Record<string, string> }>(client, { task: "alt", image: imageUrl(item.ref, projectId!, dataset!), context: item.place });
        const keep = (cur: Item["alt"], vals: Record<string, string>) => [
          ...(cur ?? []).filter((i) => i.value?.trim()),
          ...Object.entries(vals)
            .filter(([lang]) => !cur?.some((i) => i.language === lang && i.value?.trim()))
            .map(([language, value]) => ({ _key: randomKey(12), _type: "internationalizedArrayStringValue", language, value })),
        ];
        const set = { alt: keep(item.alt, out.alt), title: keep(item.title, out.title) };
        const tx = client.transaction().patch(item._id, (p) => p.set(set));
        const draft = await client.getDocument(`drafts.${item._id}`);
        if (draft) tx.patch(draft._id, (p) => p.set(set));
        await tx.commit();
        setLog((l) => [...l, `✓ ${out.alt.nl}`]);
      } catch (err) {
        setLog((l) => [...l, `✗ ${item._id}: ${err instanceof Error ? err.message : err}`]);
      }
    }
    setBusy(false);
    load();
  };

  return (
    <Box padding={4} style={{ maxWidth: 720 }}>
      <Stack gap={4}>
        <Text>
          {items === null ? "Laden…" : items.length ? `${items.length} foto's zonder Nederlandse alt-tekst.` : "Alle foto's hebben een alt-tekst. 🎉"}
        </Text>
        <Text size={1} muted>
          AI (Gemini) bekijkt elke foto en vult de alt-tekst en titel in het Nederlands en Engels in, alleen waar ze leeg zijn. Dit wordt meteen gepubliceerd: kijk ze nadien even na in “Te doen” of “Alle foto's”.
        </Text>
        <Box>
          <Button icon={SparklesIcon} text={busy ? "Bezig…" : "Alt-teksten aanvullen"} tone="primary" disabled={busy || !items?.length} onClick={run} />
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
