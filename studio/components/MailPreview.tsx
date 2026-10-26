import { Box, Button, Card, Flex, Select, Stack, Text, TextInput } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { useEffect, useMemo, useState } from "react";
import { EyeOpenIcon } from "@sanity/icons/EyeOpen";
import { defineDocumentInspector, useClient, useCurrentUser } from "sanity";
import { useDocumentPane } from "sanity/structure";
import { confirmationContent, type ConfirmationMail, type ConfirmationRetreat } from "../../lib/confirmation";
import { getDictionary } from "../../lib/dictionary";
import { mailHtml } from "../../lib/mail-template";
import { newsletterContent } from "../../lib/newsletter";
import { apiVersion, defaultLanguage, languages, type Lang } from "../../sanity/site.config";
import { mailConfigured, siteApi } from "../lib/ai";
import { SITE_URL } from "../lib/site";

type I18n = { language?: string; value?: unknown }[];
type Doc = { _id: string; _type: string; isDefault?: boolean; [k: string]: unknown };
type Retreat = ConfirmationRetreat & { _id: string; mailRef?: string; upcoming: boolean };

/** Mail documents with a preview: Bevestigingsmail (per retreat) and Nieuwsbrief-bevestiging. */
export const MAIL_TYPES = ["confirmationMail", "newsletterMail"];
const FIELDS = ["subject", "body", "payment", "waitlistSubject", "waitlistBody"] as const;

/** Side panel next to the form (Sanity document inspector): open by default on wide screens; on a phone via the eye button at the top. */
export function MailPreviewInspector() {
  const { displayed } = useDocumentPane();
  return (
    <Box padding={3} style={{ overflow: "auto", height: "100%" }}>
      <MailPreviewPanel doc={displayed as Doc} />
    </Box>
  );
}

/**
 * The real HTML mail as it goes out, filled in for an example person (Anna) and, for a Bevestigingsmail,
 * a retreat you pick and the version (sign-up / waiting list). Follows what you type (also before
 * publishing). “Stuur testmail” sends exactly this to your own address (needs mail on the site).
 */
export function MailPreviewPanel({ doc }: { doc: Doc | null | undefined }) {
  const client = useClient({ apiVersion });
  const user = useCurrentUser();
  const toast = useToast();
  const newsletter = doc?._type === "newsletterMail";
  const [lang, setLang] = useState<Lang>(defaultLanguage);
  const [waitlist, setWaitlist] = useState(false);
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [retreatId, setRetreatId] = useState("");
  const [to, setTo] = useState("");
  const [canSend, setCanSend] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [height, setHeight] = useState(700);
  const id = doc?._id?.replace(/^drafts\./, "");

  useEffect(() => setTo((t) => t || user?.email || ""), [user?.email]);
  useEffect(() => void mailConfigured().then(setCanSend), []);
  useEffect(() => {
    if (newsletter) return;
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
  }, [client, lang, id, doc?.isDefault, newsletter]);

  const mail = useMemo(() => {
    const val = (f: string) => {
      const items = doc?.[f] as I18n | undefined;
      const v = items?.find((i) => i.language === lang)?.value || items?.find((i) => i.language === defaultLanguage)?.value;
      return typeof v === "string" && v.trim() ? v : null;
    };
    return Object.fromEntries(FIELDS.map((f) => [f, val(f)])) as NonNullable<ConfirmationMail>;
  }, [doc, lang]);

  const t = getDictionary(lang).signup;
  const example: [string, string][] = [
    [t.phone, "0470 12 34 56"],
    [t.diet, lang === "en" ? "Vegetarian" : "Vegetarisch"],
  ];
  const { subject, content } = newsletter
    ? newsletterContent(lang, mail, "Anna", `${SITE_URL}/api/unsubscribe?id=…`)
    : confirmationContent(lang, mail, retreats.find((r) => r._id === retreatId) ?? { title: "Retreat" }, "Anna", waitlist, example);
  const html = mailHtml(content);

  const send = async () => {
    setBusy(true);
    try {
      await siteApi(client, "/api/mail", newsletter ? { task: "test-newsletter", to, lang, mail } : { task: "test", to, lang, waitlist, retreatId, mail });
      toast.push({ status: "success", title: "Testmail verstuurd", description: to });
    } catch (err) {
      toast.push({ status: "error", title: "Testmail mislukt", description: String(err instanceof Error ? err.message : err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack gap={3}>
      <Flex gap={2} wrap="wrap">
        <Select value={lang} onChange={(e) => setLang(e.currentTarget.value as Lang)} fontSize={1} padding={2} style={{ minWidth: 110 }}>
          {languages.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </Select>
        {newsletter ? null : (
          <>
            <Select value={waitlist ? "waitlist" : "signup"} onChange={(e) => setWaitlist(e.currentTarget.value === "waitlist")} fontSize={1} padding={2} style={{ minWidth: 130 }}>
              <option value="signup">Inschrijving</option>
              <option value="waitlist">Wachtlijst</option>
            </Select>
            <Box flex={1} style={{ minWidth: 180 }}>
              <Select value={retreatId} onChange={(e) => setRetreatId(e.currentTarget.value)} fontSize={1} padding={2}>
                {retreats.map((r) => (
                  <option key={r._id} value={r._id}>
                    {`${r.title ?? "Retreat"}${r.startDate ? ` · ${r.startDate.slice(0, 4)}` : ""}${r.deposit ? " · voorschot" : ""}`}
                  </option>
                ))}
              </Select>
            </Box>
          </>
        )}
      </Flex>
      <Card padding={3} radius={2} border>
        <Text size={0} muted>
          Onderwerp
        </Text>
        <Box marginTop={2}>
          <Text size={1} weight="semibold">
            {subject}
          </Text>
        </Box>
      </Card>
      <Card radius={2} border overflow="hidden">
        <iframe
          title="Voorbeeld van de mail"
          srcDoc={html}
          style={{ width: "100%", height, border: 0, display: "block" }}
          onLoad={(e) => setHeight((e.currentTarget.contentDocument?.documentElement.scrollHeight ?? 680) + 20)}
        />
      </Card>
      <Text size={0} muted>
        {newsletter ? "Voorbeeld voor “Anna”; de afmeldlink is per persoon." : "Voorbeeld voor “Anna” met twee voorbeeldantwoorden. Het betaalblok verschijnt enkel bij een retreat met voorschot."}
      </Text>
      <Card padding={3} radius={2} border tone={canSend === false ? "caution" : "default"}>
        <Stack gap={3}>
          <Text size={1} weight="semibold">
            Testmail
          </Text>
          {canSend === false ? <Text size={1}>De site kan nog geen mail versturen: zet RESEND_API_KEY (of SMTP_URL) in Netlify → Environment variables.</Text> : null}
          <Flex gap={2} wrap="wrap">
            <Box flex={1} style={{ minWidth: 180 }}>
              <TextInput type="email" value={to} onChange={(e) => setTo(e.currentTarget.value)} placeholder="jij@voorbeeld.be" fontSize={1} />
            </Box>
            <Button text={busy ? "Versturen…" : "Stuur testmail"} tone="primary" fontSize={1} disabled={busy || !to || (!newsletter && !retreatId) || canSend === false} onClick={send} />
          </Flex>
        </Stack>
      </Card>
    </Stack>
  );
}

const CLOSED = "mail-preview-closed";

/** The side panel definition (sanity.config.ts → document.inspectors). Closing it keeps it closed for this browser session. */
export const mailPreviewInspector = defineDocumentInspector({
  name: "mail-preview",
  useMenuItem: () => ({ icon: EyeOpenIcon, title: "Voorbeeld", showAsAction: true }),
  component: MailPreviewInspector,
  onClose: ({ params }) => {
    sessionStorage.setItem(CLOSED, "1");
    return { params };
  },
  onOpen: ({ params }) => {
    sessionStorage.removeItem(CLOSED);
    return { params };
  },
});

/** Rendered once in a mail document's form: opens the preview panel on wide screens. */
export function OpenMailPreview() {
  const { inspector, openInspector } = useDocumentPane();
  useEffect(() => {
    if (!inspector && !sessionStorage.getItem(CLOSED) && window.matchMedia("(min-width: 1100px)").matches) openInspector("mail-preview");
    // only when the document opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
