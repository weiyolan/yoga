import { Badge, Box, Button, Card, Flex, Grid, Heading, Stack, Text, TextArea } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { useEffect, useState, type ReactNode } from "react";
import { useClient } from "sanity";
import { IntentLink } from "sanity/router";
import type { UserViewComponent } from "sanity/structure";
import { apiVersion } from "../../sanity/site.config";
import { recomputeBooked } from "../lib/booked";
import { SIGNUP_STATUSES } from "../schemaTypes/documents/signup";

type Signup = {
  _id: string;
  status?: string;
  notes?: string;
  retreat?: { _ref: string };
  name?: string;
  email?: string;
  phone?: string;
  persons?: number;
  room?: string;
  diet?: string;
  message?: string;
  lang?: string;
  consent?: boolean;
  waitlist?: boolean;
  submittedAt?: string;
};
type RetreatInfo = { _id: string; title?: string; startDate?: string; endDate?: string; capacity?: number; booked?: number };

export const STATUS_TONE: Record<string, "primary" | "positive" | "caution" | "critical" | "default"> = { new: "primary", confirmed: "positive", waitlist: "caution", cancelled: "critical" };

const date = (iso?: string) => (iso ? new Date(iso).toLocaleString("nl-BE", { dateStyle: "long", timeStyle: "short" }) : "-");
const day = (iso?: string) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" }) : "");

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={2}>
      <Text size={1} muted weight="medium">
        {label}
      </Text>
      <Text size={2}>{children || "-"}</Text>
    </Stack>
  );
}

/**
 * Default view of a sign-up: the submission as a readable card (not greyed-out form fields),
 * with status buttons and an internal note. A status change also updates `booked` on the retreat.
 */
export const SignupView: UserViewComponent = ({ document }) => {
  const doc = document.displayed as Signup;
  const client = useClient({ apiVersion });
  const toast = useToast();
  const [retreat, setRetreat] = useState<RetreatInfo | null>(null);
  const [notes, setNotes] = useState(doc.notes ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => setNotes(doc.notes ?? ""), [doc.notes]);
  useEffect(() => {
    if (!doc.retreat?._ref) return;
    client
      .fetch<RetreatInfo>(`*[_id == $id][0]{ _id, "title": coalesce(title[language == "nl"][0].value, title[0].value), startDate, endDate, capacity, booked }`, { id: doc.retreat._ref })
      .then(setRetreat, () => {});
  }, [client, doc.retreat?._ref, doc.status]);

  const setStatus = async (status: string) => {
    if (status === doc.status) return;
    setBusy(true);
    try {
      await client.patch(doc._id).set({ status }).commit();
      await recomputeBooked(client, doc.retreat?._ref);
      toast.push({ status: "success", title: `Status: ${SIGNUP_STATUSES.find((s) => s.value === status)?.title}` });
    } catch (err) {
      toast.push({ status: "error", title: "Opslaan mislukt", description: String(err) });
    } finally {
      setBusy(false);
    }
  };
  const saveNotes = () => {
    if (notes === (doc.notes ?? "")) return;
    client.patch(doc._id).set({ notes }).commit().catch((err) => toast.push({ status: "error", title: "Notitie niet opgeslagen", description: String(err) }));
  };

  const persons = doc.persons ?? 1;
  const left = retreat?.capacity ? retreat.capacity - (retreat.booked ?? 0) : null;

  return (
    <Box padding={4} style={{ maxWidth: 760 }}>
      <Stack gap={5}>
        <Stack gap={3}>
          <Flex align="center" gap={3} wrap="wrap">
            <Heading size={3}>{doc.name || "Inschrijving"}</Heading>
            {persons > 1 ? <Badge>{persons} personen</Badge> : null}
            {doc.waitlist ? <Badge tone="caution">Vraagt wachtlijst (was volzet)</Badge> : null}
            <Badge tone={STATUS_TONE[doc.status ?? "new"]}>{SIGNUP_STATUSES.find((s) => s.value === doc.status)?.title ?? "Nieuw"}</Badge>
          </Flex>
          <Text muted size={1}>
            Ingeschreven op {date(doc.submittedAt)}
            {doc.lang ? ` · ${doc.lang.toUpperCase()}` : ""}
          </Text>
        </Stack>

        {retreat ? (
          <Card padding={3} radius={2} tone="transparent" border>
            <Flex align="center" justify="space-between" gap={3} wrap="wrap">
              <Stack gap={2}>
                <Text weight="semibold">
                  <IntentLink intent="edit" params={{ id: retreat._id.replace(/^drafts\./, ""), type: "retreat" }}>
                    {retreat.title ?? "Retreat"}
                  </IntentLink>
                </Text>
                <Text size={1} muted>
                  {[day(retreat.startDate), day(retreat.endDate)].filter(Boolean).join(" – ")}
                </Text>
              </Stack>
              {retreat.capacity ? (
                <Text size={1}>
                  Geboekt {retreat.booked ?? 0} / {retreat.capacity}
                  {left !== null ? ` · ${left > 0 ? `nog ${left} vrij` : "volzet"}` : ""}
                </Text>
              ) : null}
            </Flex>
          </Card>
        ) : null}

        <Stack gap={3}>
          <Text size={1} muted weight="medium">
            Status
          </Text>
          <Flex gap={2} wrap="wrap">
            {SIGNUP_STATUSES.map((s) => (
              <Button
                key={s.value}
                text={s.title}
                mode={doc.status === s.value || (!doc.status && s.value === "new") ? "default" : "ghost"}
                tone={STATUS_TONE[s.value]}
                disabled={busy}
                onClick={() => setStatus(s.value)}
              />
            ))}
          </Flex>
          {doc.status !== "confirmed" && persons && retreat?.capacity && left !== null && left < persons ? (
            <Text size={1} muted>
              ⚠ Er zijn nog {Math.max(left, 0)} plaatsen vrij voor {persons} personen.
            </Text>
          ) : null}
        </Stack>

        <Card padding={4} radius={3} shadow={1}>
          <Grid gridTemplateColumns={[1, 2]} gap={5}>
            <Row label="E-mail">{doc.email ? <a href={`mailto:${doc.email}`}>{doc.email}</a> : null}</Row>
            <Row label="GSM">{doc.phone ? <a href={`tel:${doc.phone.replace(/\s/g, "")}`}>{doc.phone}</a> : null}</Row>
            <Row label="Aantal personen">{persons}</Row>
            <Row label="Kamer / prijs">{doc.room}</Row>
          </Grid>
          <Stack gap={5} marginTop={5}>
            <Row label="Dieetwensen of allergieën">{doc.diet}</Row>
            <Row label="Vragen of opmerkingen">
              <span style={{ whiteSpace: "pre-wrap" }}>{doc.message}</span>
            </Row>
            <Row label="Akkoord gegevens">{doc.consent ? "Ja" : "Nee"}</Row>
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
