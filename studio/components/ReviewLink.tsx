import { CopyIcon } from "@sanity/icons/Copy";
import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { LaunchIcon } from "@sanity/icons/Launch";
import { Badge, Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { useEffect, useState } from "react";
import { useClient, useFormValue, type StringInputProps } from "sanity";
import { IntentLink, useRouter } from "sanity/router";
import { reviewHref } from "../../lib/routes";
import { apiVersion } from "../../sanity/site.config";
import { siteOrigin } from "../lib/site";

type Info = {
  published: boolean;
  form?: { _id: string; name?: string; isDefault?: boolean } | null;
  count: number;
  participants: number;
};

const key = () => Math.random().toString(36).slice(2, 14).padEnd(12, "0");
const tr = (kind: string, nl: string, en: string) => [
  { _key: key(), _type: `internationalizedArray${kind}Value`, language: "nl", value: nl },
  { _key: key(), _type: `internationalizedArray${kind}Value`, language: "en", value: en },
];
const para = (text: string) => ({ _key: key(), _type: "block", style: "normal", markDefs: [], children: [{ _key: key(), _type: "span", marks: [], text }] });
const blocks = (nl: string[], en: string[]) => [
  { _key: key(), _type: "internationalizedArraySimpleBlockContentValue", language: "nl", value: nl.map(para) },
  { _key: key(), _type: "internationalizedArraySimpleBlockContentValue", language: "en", value: en.map(para) },
];

/** Retreat → Achteraf → Feedback: the review link (copy / open), which form it shows, how many answered, and “Bedankbrief maken”. */
export function ReviewLinkInput(_: StringInputProps) {
  const client = useClient({ apiVersion });
  const toast = useToast();
  const { navigateIntent } = useRouter();
  const rawId = String(useFormValue(["_id"]) ?? "");
  const id = rawId.replace(/^drafts\./, "");
  const slug = (useFormValue(["slug"]) as { current?: string } | undefined)?.current;
  const title = ((useFormValue(["title"]) as { language?: string; value?: string }[] | undefined) ?? []).find((t) => t.language === "nl")?.value ?? "de retreat";
  const formRef = (useFormValue(["reviewForm"]) as { _ref?: string } | undefined)?._ref;
  const [info, setInfo] = useState<Info | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    client
      .fetch<Info>(
        `{
          "published": defined(*[_id == $id][0]._id),
          "form": coalesce(*[_id == $form][0]{ _id, name, isDefault }, *[_type == "reviewForm" && isDefault == true && !(_id in path("drafts.**"))][0]{ _id, name, isDefault }),
          "count": count(*[_type == "reviewSubmission" && retreat._ref == $id]),
          "participants": count(*[_type == "signup" && retreat._ref == $id && status == "confirmed"])
        }`,
        { id, form: formRef ?? "" },
        { perspective: "raw" },
      )
      .then(setInfo, () => setInfo(null));
  }, [client, id, formRef]);

  const origin = siteOrigin();
  const url = (lang: "nl" | "en") => `${origin}${reviewHref(lang, slug)}`;
  const copy = async (lang: "nl" | "en") => {
    try {
      await navigator.clipboard.writeText(url(lang));
      toast.push({ status: "success", title: "Reviewlink gekopieerd", description: url(lang) });
    } catch {
      toast.push({ status: "info", title: "Kopieer deze link", description: url(lang) });
    }
  };

  // a new Brief (draft) to the confirmed participants of this retreat, with a button to the feedback form
  const thankYou = async () => {
    setBusy(true);
    try {
      const doc = await client.create({
        _id: `drafts.${crypto.randomUUID()}`,
        _type: "newsletter",
        title: `Bedankt: ${title}`,
        subject: tr("String", `Bedankt voor ${title}, {naam}!`, `Thank you for ${title}, {naam}!`),
        heading: tr("String", "Bedankt dat je erbij was", "Thank you for being there"),
        body: blocks(
          [
            "Dag {naam},",
            `Wat fijn dat je erbij was op ${title}! We hopen dat je met een opgeladen batterij en mooie herinneringen naar huis bent gegaan.`,
            "Om onze volgende retreats nog fijner te maken, horen we graag hoe jij het hebt ervaren. Het invullen duurt maar een paar minuutjes.",
            "Tot snel op de mat,",
            "Rita & Philippe",
          ],
          [
            "Hi {naam},",
            `So lovely that you joined us for ${title}! We hope you went home recharged and with beautiful memories.`,
            "To make our next retreats even better, we'd love to hear how it was for you. It only takes a few minutes.",
            "See you on the mat soon,",
            "Rita & Philippe",
          ],
        ),
        blocks: [{ _key: key(), _type: "newsletterReview", retreat: { _type: "reference", _ref: id } }],
        to: { groups: [], retreats: [{ _key: key(), _type: "reference", _ref: id }], statuses: ["confirmed"] },
      });
      toast.push({ status: "success", title: "Bedankbrief gemaakt", description: "Pas de tekst aan, publiceer en klik op “Brief versturen…”." });
      navigateIntent("edit", { id: doc._id.replace(/^drafts\./, ""), type: "newsletter" });
    } catch (err) {
      toast.push({ status: "error", title: "Bedankbrief maken mislukt", description: String(err) });
    } finally {
      setBusy(false);
    }
  };

  if (!slug) return <Text size={1} muted>Vul eerst de slug in (tab Basis): de link is /retreats/&lt;slug&gt;/review.</Text>;

  return (
    <Card border radius={3} padding={4} tone="primary">
      <Stack gap={4}>
        <Stack gap={2}>
          <Flex gap={2} align="center" wrap="wrap">
            <Text size={1} weight="semibold">
              Reviewlink
            </Text>
            {info && !info.published ? <Badge tone="caution">Publiceer de retreat eerst</Badge> : null}
            {info?.count ? <Badge tone="positive">{info.count === 1 ? "1 antwoord" : `${info.count} antwoorden`}</Badge> : null}
          </Flex>
          <Card padding={3} radius={2} border tone="default">
            <Text size={1} style={{ wordBreak: "break-all", fontFamily: "monospace" }}>
              {url("nl")}
            </Text>
          </Card>
          <Text size={0} muted>
            Niet gelinkt op de site en niet in Google: enkel wie de link krijgt, vindt het formulier. Werkt altijd, ook vóór de retreat voorbij is (handig om te testen).
          </Text>
        </Stack>
        <Flex gap={2} wrap="wrap">
          <Button icon={CopyIcon} text="Kopieer link (NL)" tone="primary" onClick={() => copy("nl")} />
          <Button icon={CopyIcon} text="EN" mode="ghost" onClick={() => copy("en")} title={url("en")} />
          <Button as="a" href={url("nl")} target="_blank" rel="noopener" icon={LaunchIcon} text="Openen" mode="ghost" />
          <Button icon={EnvelopeIcon} text={busy ? "Bezig…" : "Bedankbrief maken"} mode="ghost" disabled={busy || !id} onClick={thankYou} title="Een nieuwe brief naar de bevestigde deelnemers van deze retreat, met een knop naar het feedbackformulier" />
        </Flex>
        <Box>
          <Text size={1} muted>
            Formulier:{" "}
            {info?.form ? (
              <IntentLink intent="edit" params={{ id: info.form._id, type: "reviewForm" }}>
                {info.form.name ?? "Feedbackformulier"}
              </IntentLink>
            ) : (
              "het korte standaardformulier (sterren, naam, e-mail, tekst)"
            )}
            {info?.form && !formRef ? " (standaard)" : ""}
            {formRef && info?.form?._id !== formRef ? " · het gekozen formulier is nog niet gepubliceerd" : ""}
            {info ? ` · ${info.participants} bevestigde deelnemer${info.participants === 1 ? "" : "s"}` : ""}
          </Text>
        </Box>
      </Stack>
    </Card>
  );
}
