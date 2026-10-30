import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle";
import { randomKey } from "@sanity/util/content";
import { defineType, type Template } from "sanity";
import { getDictionary } from "../../../lib/dictionary";
import { languages } from "../../../sanity/site.config";
import { i18nString, i18nText } from "../shared/i18n";

/** The three kinds, each with a fixed `_id` `receiptMail-<kind>` (Studio → Mails). */
export const RECEIPT_MAILS = [
  { kind: "contact", title: "Bevestiging bericht" },
  { kind: "class", title: "Bevestiging les-aanvraag" },
  { kind: "review", title: "Bevestiging testimonial" },
] as const;

/**
 * Mails → Bevestiging bericht / les-aanvraag / review: the “we got it” mail to whoever sent the contact
 * form, a class request (Lessen planning) or a review (lib/receipt.ts). What they sent is added below the
 * text as a small table. Empty = the built-in text. On/off: Mails → Opties.
 */
export const receiptMail = defineType({
  name: "receiptMail",
  title: "Bevestiging",
  type: "document",
  icon: CheckmarkCircleIcon,
  fields: [
    i18nString("subject", { title: "Onderwerp", description: "Onderwerp van deze bevestigingsmail: wat de afzender in de inbox ziet. Invulwoorden zoals in de tekst. Leeg = standaardonderwerp (zie Voorbeeld)." }),
    i18nString("heading", { title: "Titel in de mail", description: "Grote titel bovenaan in deze bevestigingsmail, boven de tekst. Invulwoorden zoals in de tekst. Leeg = standaard." }),
    i18nText("body", {
      title: "Tekst",
      description:
        "De tekst van deze bevestigingsmail, onder de titel. Invulwoorden: {naam} = hun voornaam · bij een les-aanvraag ook {les} (Yin yoga · Di 19:30 · Studio) en {stijl} (Yin yoga) · bij een review {retreat}. Wat ze stuurden komt er automatisch als tabel onder. Leeg = standaardtekst (zie Voorbeeld).",
    }),
  ],
  preview: {
    select: { id: "_id" },
    prepare: ({ id }) => ({ title: RECEIPT_MAILS.find((m) => id?.endsWith(`receiptMail-${m.kind}`))?.title ?? "Bevestiging" }),
  },
});

/** One template per kind: a new Bevestiging mail opens with the standard text (NL + EN) filled in, ready to edit. */
export const receiptTemplates: Template[] = RECEIPT_MAILS.map((m) => {
  const of = (kind: "String" | "Text", field: "Subject" | "Heading" | "Body") =>
    languages.map((l) => ({
      _key: randomKey(12),
      _type: `internationalizedArray${kind}Value`,
      language: l.id,
      value: getDictionary(l.id).receipt[`${m.kind}${field}`],
    }));
  return {
    id: `receiptMail-${m.kind}`,
    title: m.title,
    schemaType: "receiptMail",
    value: { subject: of("String", "Subject"), heading: of("String", "Heading"), body: of("Text", "Body") },
  };
});
