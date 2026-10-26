import { Box, Button, Card, Flex, Select, Stack, Text, TextInput } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { useEffect, useMemo, useState } from "react";
import { useClient, useCurrentUser } from "sanity";
import { confirmationContent, type ConfirmationMail, type ConfirmationRetreat } from "../../lib/confirmation";
import { getDictionary } from "../../lib/dictionary";
import { mailHtml } from "../../lib/mail-template";
import { apiVersion, defaultLanguage, languages, type Lang } from "../../sanity/site.config";
import { mailConfigured, siteApi } from "../lib/ai";

type I18n = { language?: string; value?: unknown }[];
type Doc = { _id: string; isDefault?: boolean; [k: string]: unknown };
type Retreat = ConfirmationRetreat & { _id: string; mailRef?: string; upcoming: boolean };

const FIELDS = ["subject", "body", "payment", "waitlistSubject", "waitlistBody"] as const;

/**
 * Bevestigingsmail → “Voorbeeld”: the real HTML mail as the participant gets it, filled in for an
 * example person and a retreat you pick, per language and version. Follows what you type (also
 * before publishing). “Stuur testmail” sends exactly this to your own address (needs mail on the site).
 */
export function MailPreview({ document }: { document: { displayed: Doc } }) {
  const doc = document.displayed;
  const client = useClient({ apiVersion });
  const user = useCurrentUser();
  const toast = useToast();
  const [lang, setLang] = useState<Lang>(defaultLanguage);
  const [waitlist, setWaitlist] = useState(false);
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [retreatId, setRetreatId] = useState("");
  const [to, setTo] = useState("");
  const [canSend, setCanSend] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [height, setHeight] = useState(900);
  const id = doc?._id?.replace(/^drafts\./, "");

  useEffect(() => setTo((t) => t || user?.email || ""), [user?.email]);
  useEffect(() => void mailConfigured().then(setCanSend), []);
  useEffect(() => {
    client
      .fetch<Retreat[]>(
        `*[_type == "retreat" && !(_id in path("drafts.**"))] | order(startDate desc){
          _id, "title": coalesce(title[language == $lang][0].value, title[language == "nl"][0].value), startDate, endDate, deposit,
          "photo": cardPhoto->image.asset->url, "mailRef": confirmationMail._ref,
          "upcoming": dateTime(endDate + "T23:59:59Z") >= dateTime(now())
        }`,
        { lang },
      )
      .then((rs) => {
        setRetreats(rs);
        // default: a retreat that uses this mail, else the first upcoming one
        setRetreatId((cur) => cur || (rs.find((r) => r.mailRef === id || (doc?.isDefault && !r.mailRef && r.upcoming)) ?? rs.find((r) => r.upcoming) ?? rs[0])?._id || "");
      }, console.error);
  }, [client, lang, id, doc?.isDefault]);

  const mail = useMemo(() => {
    const val = (f: string) => {
      const items = doc?.[f] as I18n | undefined;
      const v = items?.find((i) => i.language === lang)?.value || items?.find((i) => i.language === defaultLanguage)?.value;
      return typeof v === "string" && v.trim() ? v : null;
    };
    return Object.fromEntries(FIELDS.map((f) => [f, val(f)])) as NonNullable<ConfirmationMail>;
  }, [doc, lang]);
  const retreat = retreats.find((r) => r._id === retreatId) ?? { title: "Retreat" };
  const t = getDictionary(lang).signup;
  const example: [string, string][] = [
    [t.phone, "0470 12 34 56"],
    [t.diet, lang === "en" ? "Vegetarian" : "Vegetarisch"],
  ];
  const { subject, content } = confirmationContent(lang, mail, retreat, "Anna", waitlist, example);
  const html = mailHtml(content);

  const send = async () => {
    setBusy(true);
    try {
      await siteApi(client, "/api/mail", { task: "test", to, lang, waitlist, retreatId, mail });
      toast.push({ status: "success", title: "Testmail verstuurd", description: to });
    } catch (err) {
      toast.push({ status: "error", title: "Testmail mislukt", description: String(err instanceof Error ? err.message : err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box padding={4}>
      <Stack gap={4} style={{ maxWidth: 680, margin: "0 auto" }}>
        <Flex gap={2} wrap="wrap">
          <Select value={lang} onChange={(e) => setLang(e.currentTarget.value as Lang)} style={{ minWidth: 120 }}>
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </Select>
          <Select value={waitlist ? "waitlist" : "signup"} onChange={(e) => setWaitlist(e.currentTarget.value === "waitlist")} style={{ minWidth: 150 }}>
            <option value="signup">Inschrijving</option>
            <option value="waitlist">Wachtlijst</option>
          </Select>
          <Box flex={1} style={{ minWidth: 200 }}>
            <Select value={retreatId} onChange={(e) => setRetreatId(e.currentTarget.value)}>
              {retreats.map((r) => (
                <option key={r._id} value={r._id}>
                  {`${r.title ?? "Retreat"}${r.startDate ? ` · ${r.startDate.slice(0, 4)}` : ""}${r.deposit ? " · voorschot" : ""}`}
                </option>
              ))}
            </Select>
          </Box>
        </Flex>
        <Card padding={3} radius={2} border>
          <Text size={1} muted>
            Onderwerp
          </Text>
          <Box marginTop={2}>
            <Text weight="semibold">{subject}</Text>
          </Box>
        </Card>
        <Card radius={2} border overflow="hidden">
          <iframe
            title="Voorbeeld van de mail"
            srcDoc={html}
            style={{ width: "100%", height, border: 0, display: "block" }}
            onLoad={(e) => setHeight((e.currentTarget.contentDocument?.documentElement.scrollHeight ?? 880) + 20)}
          />
        </Card>
        <Text size={1} muted>
          Voorbeeld voor “Anna” met twee voorbeeldantwoorden. Het betaalblok verschijnt enkel bij een retreat met voorschot.
        </Text>
        <Card padding={3} radius={2} border tone={canSend === false ? "caution" : "default"}>
          <Stack gap={3}>
            <Text size={1} weight="semibold">
              Testmail
            </Text>
            {canSend === false ? (
              <Text size={1}>De site kan nog geen mail versturen: zet RESEND_API_KEY (of SMTP_URL) in Netlify → Environment variables.</Text>
            ) : null}
            <Flex gap={2}>
              <Box flex={1}>
                <TextInput type="email" value={to} onChange={(e) => setTo(e.currentTarget.value)} placeholder="jij@voorbeeld.be" />
              </Box>
              <Button text={busy ? "Versturen…" : "Stuur testmail"} tone="primary" disabled={busy || !to || !retreatId || canSend === false} onClick={send} />
            </Flex>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}
