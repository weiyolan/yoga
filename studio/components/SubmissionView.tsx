import { Badge, Box, Button, Card, Flex, Heading, Stack, Text, TextArea } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { useEffect, useState, type ReactNode } from "react";
import { useClient } from "sanity";
import type { UserViewComponent } from "sanity/structure";
import { apiVersion } from "../../sanity/site.config";

type Doc = { _id: string; status?: string; notes?: string; submittedAt?: string; lang?: string; [key: string]: unknown };
type Client = ReturnType<typeof useClient>;
type Tone = "primary" | "positive" | "caution" | "critical" | "default";

export type SubmissionViewOptions = {
  title: (doc: Doc) => string;
  statuses: { title: string; value: string; tone: Tone }[];
  rows: { label: string; render: (doc: Doc) => ReactNode }[];
  /** Runs after the status was saved (e.g. publish an approved review). */
  onStatus?: (client: Client, doc: Doc, status: string) => Promise<void>;
};

const date = (iso?: string) => (iso ? new Date(iso).toLocaleString("nl-BE", { dateStyle: "long", timeStyle: "short" }) : "-");

/** Default view of a form submission (message, review): a readable card with status buttons and a note. */
export function submissionView({ title, statuses, rows, onStatus }: SubmissionViewOptions): UserViewComponent {
  return function SubmissionView({ document }) {
    const doc = document.displayed as Doc;
    const client = useClient({ apiVersion });
    const toast = useToast();
    const [notes, setNotes] = useState(doc.notes ?? "");
    const [busy, setBusy] = useState(false);
    useEffect(() => setNotes(doc.notes ?? ""), [doc.notes]);
    const current = statuses.find((s) => s.value === (doc.status ?? statuses[0].value)) ?? statuses[0];

    const setStatus = async (status: string) => {
      if (status === doc.status) return;
      setBusy(true);
      try {
        await client.patch(doc._id).set({ status }).commit();
        await onStatus?.(client, { ...doc, status }, status);
        toast.push({ status: "success", title: `Status: ${statuses.find((s) => s.value === status)?.title}` });
      } catch (err) {
        toast.push({ status: "error", title: "Opslaan mislukt", description: String(err) });
      } finally {
        setBusy(false);
      }
    };
    const saveNotes = () => {
      if (notes !== (doc.notes ?? "")) client.patch(doc._id).set({ notes }).commit().catch((err) => toast.push({ status: "error", title: "Notitie niet opgeslagen", description: String(err) }));
    };

    return (
      <Box padding={4} style={{ maxWidth: 760 }}>
        <Stack gap={5}>
          <Stack gap={3}>
            <Flex align="center" gap={3} wrap="wrap">
              <Heading size={3}>{title(doc)}</Heading>
              <Badge tone={current.tone}>{current.title}</Badge>
            </Flex>
            <Text muted size={1}>
              Verstuurd op {date(doc.submittedAt)}
              {doc.lang ? ` · ${doc.lang.toUpperCase()}` : ""}
            </Text>
          </Stack>
          <Stack gap={3}>
            <Text size={1} muted weight="medium">
              Status
            </Text>
            <Flex gap={2} wrap="wrap">
              {statuses.map((s) => (
                <Button key={s.value} text={s.title} tone={s.tone} mode={current.value === s.value ? "default" : "ghost"} disabled={busy} onClick={() => setStatus(s.value)} />
              ))}
            </Flex>
          </Stack>
          <Card padding={4} radius={3} shadow={1}>
            <Stack gap={5}>
              {rows.map((r) => (
                <Stack key={r.label} gap={2}>
                  <Text size={1} muted weight="medium">
                    {r.label}
                  </Text>
                  <Text size={2}>
                    <span style={{ whiteSpace: "pre-wrap" }}>{r.render(doc) || "-"}</span>
                  </Text>
                </Stack>
              ))}
            </Stack>
          </Card>
          <Stack gap={3}>
            <Text size={1} muted weight="medium">
              Interne notitie (enkel zichtbaar in de Studio)
            </Text>
            <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.currentTarget.value)} onBlur={saveNotes} />
          </Stack>
        </Stack>
      </Box>
    );
  };
}
