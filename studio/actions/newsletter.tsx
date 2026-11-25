import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { Box, Button, Card, Checkbox, Flex, Stack, Text } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { useEffect, useState } from "react";
import { useClient, type DocumentActionComponent } from "sanity";
import { contacts, CONTACTS_QUERY, recipients, type ContactsData, type Recipients } from "../../lib/contacts";
import { apiVersion } from "../../sanity/site.config";
import { mailConfigured, siteApi } from "../lib/ai";

type Newsletter = { _id: string; title?: string; audience?: string[]; to?: Recipients; sentAt?: string; sentCount?: number };

/** Who it goes to right now (Naar wie, minus everyone who unsubscribed), per language. */
function Summary({ to, audience, onCount }: { to?: Recipients; audience?: string[]; onCount: (n: number) => void }) {
  const client = useClient({ apiVersion });
  const [counts, setCounts] = useState<{ nl: number; en: number } | null>(null);
  const [error, setError] = useState("");
  const key = JSON.stringify([to ?? null, audience ?? null]);
  useEffect(() => {
    client.fetch<ContactsData>(CONTACTS_QUERY, {}, { perspective: "raw" }).then(
      (d) => {
        const list = recipients(contacts(d), to, audience);
        setCounts({ nl: list.filter((c) => c.lang === "nl").length, en: list.filter((c) => c.lang === "en").length });
        onCount(list.length);
      },
      (e: Error) => setError(e.message),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, key, onCount]);
  if (error) return <Text size={1}>Contactboek laden mislukt: {error}</Text>;
  if (!counts) return <Text size={1}>Ontvangers tellen…</Text>;
  return (
    <Stack gap={3}>
      <Text size={2} weight="semibold">
        {counts.nl + counts.en} ontvangers ({counts.nl} NL, {counts.en} EN)
      </Text>
      <Text size={1} muted>
        Zoals gekozen in het tabblad “Naar wie”, zonder wie zich afmeldde. Elk krijgt de brief in zijn taal, met een afmeldlink.
      </Text>
    </Stack>
  );
}

/**
 * Brief → “Brief versturen”: the published version to its recipients (`to`), after a confirm with
 * the number of recipients (app/api/mail task "issue"). Once; again only with an extra tick. Only shown
 * when there are no unpublished changes (then it is the main button; else Publiceer is).
 */
export const sendNewsletterAction: DocumentActionComponent = ({ id, published, draft, onComplete }) => {
  const doc = published as Newsletter | null;
  const client = useClient({ apiVersion });
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);
  const [again, setAgain] = useState(false);
  const [canSend, setCanSend] = useState<boolean | null>(null);
  useEffect(() => void mailConfigured().then(setCanSend), []);

  // unpublished changes: Publiceer is the main button; this one comes back once they are published
  if (!doc || draft) return null;
  const blocked = canSend === false ? "De site kan nog geen mail versturen (RESEND_API_KEY of SMTP_URL in Netlify)." : "";
  const close = () => {
    setOpen(false);
    setAgain(false);
    onComplete();
  };
  const send = async () => {
    setBusy(true);
    try {
      const res = await siteApi<{ sent: number; failed: string[] }>(client, "/api/mail", { task: "issue", id, again });
      toast.push({ status: res.failed.length ? "warning" : "success", title: `Brief verstuurd naar ${res.sent} adressen`, description: res.failed.length ? `Mislukt: ${res.failed.join(", ")}` : undefined });
      close();
    } catch (err) {
      toast.push({ status: "error", title: "Versturen mislukt", description: String(err instanceof Error ? err.message : err) });
    } finally {
      setBusy(false);
    }
  };

  return {
    label: doc?.sentAt ? "Opnieuw versturen…" : "Brief versturen…",
    icon: EnvelopeIcon,
    tone: "primary",
    disabled: !!blocked || busy,
    title: blocked || (doc.sentAt ? `Al verstuurd op ${doc.sentAt.slice(0, 10)} naar ${doc.sentCount ?? 0} adressen` : "Naar de gekozen ontvangers versturen"),
    onHandle: () => setOpen(true),
    dialog: open && {
      type: "dialog",
      header: `“${doc?.title ?? "Brief"}” versturen`,
      onClose: close,
      content: (
        <Stack gap={4} padding={1}>
          <Summary to={doc?.to} audience={doc?.audience} onCount={setCount} />
          {doc?.sentAt ? (
            <Card padding={3} radius={2} tone="caution" border>
              <Flex gap={3} align="center">
                <Checkbox id="again" checked={again} onChange={(e) => setAgain(e.currentTarget.checked)} />
                <Box flex={1}>
                  <Text size={1}>
                    <label htmlFor="again">
                      Al verstuurd op {doc.sentAt.slice(0, 10)} naar {doc.sentCount ?? 0} adressen. Toch iedereen opnieuw mailen.
                    </label>
                  </Text>
                </Box>
              </Flex>
            </Card>
          ) : null}
          <Text size={1} muted>
            Tip: stuur eerst een testmail naar jezelf (rechts, onder het voorbeeld).
          </Text>
          <Flex gap={2} justify="flex-end">
            <Button mode="ghost" text="Annuleren" onClick={close} />
            <Button tone="primary" text={busy ? "Versturen…" : `Verstuur naar ${count}`} disabled={busy || !count || (!!doc?.sentAt && !again)} onClick={send} />
          </Flex>
        </Stack>
      ),
    },
  };
};
