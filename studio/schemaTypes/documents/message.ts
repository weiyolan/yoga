import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { defineField, defineType } from "sanity";
import { statusPreview, type StatusDef } from "../../components/StatusPreview";

export const MESSAGE_STATUSES: StatusDef[] = [
  { title: "Nieuw", value: "new", tone: "primary" },
  { title: "Beantwoord", value: "answered", tone: "positive" },
  { title: "Archief", value: "archived", tone: "default" },
];

/**
 * A message from the contact form, or from a sign-up form's “meer info” / “hou me op de hoogte”. Like `signup`: created by the website with a
 * dotted `_id` (`message.<uuid>`), never returned by the public API; only status
 * and notes are editable.
 */
export const message = defineType({
  name: "message",
  title: "Bericht",
  type: "document",
  icon: EnvelopeIcon,
  liveEdit: true,
  fields: [
    defineField({
      name: "status",
      title: "Status",
      description: "Enkel intern: hou bij of je dit bericht al beantwoordde. Berichten op “Nieuw” tellen mee in het bolletje bij Contactformulier in het menu; “Archief” zet het opzij.",
      type: "string",
      options: {
        list: MESSAGE_STATUSES.map(({ title, value }) => ({ title, value })),
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "new",
    }),
    defineField({
      name: "notes",
      title: "Interne notitie",
      description: "Enkel intern in de Studio: de afzender ziet dit nooit. Handig om te noteren wat je antwoordde of nog moet doen.",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "name",
      title: "Naam",
      description: "Ingevuld op de website (contactformulier, les-aanvraag of “meer info” bij een retreat). Staat ook in de meldingsmail aan jullie en in het contactboek.",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "email",
      title: "E-mail",
      description: "Ingevuld op het formulier van de website. Reageer gewoon op de meldingsmail: je antwoord gaat naar dit adres. Komt ook in het contactboek; nooit publiek op de site.",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "phone",
      title: "GSM",
      description: "Ingevuld bij een les-aanvraag of bij “meer info” / “hou me op de hoogte” op een inschrijfformulier. Enkel intern en in het contactboek, handig om terug te bellen.",
      type: "string",
      readOnly: true,
      hidden: ({ value }) => !value,
    }),
    defineField({
      name: "retreat",
      title: "Over retreat",
      description: "Enkel gevuld als het bericht via het inschrijfformulier van deze retreat kwam: “meer info” of “hou me op de hoogte”. Enkel intern, zo weet je over welke retreat het gaat.",
      type: "reference",
      to: [{ type: "retreat" }],
      readOnly: true,
      hidden: ({ value }) => !value,
    }),
    defineField({
      name: "subject",
      title: "Onderwerp",
      description: "Gekozen op het contactformulier, of automatisch: “Les: …” bij een les-aanvraag, “Meer info: …” of “Op de hoogte houden: …” bij een retreat. Enkel intern en in de meldingsmail.",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "message",
      title: "Bericht",
      description: "De tekst die de afzender op de website schreef. Enkel intern, in de meldingsmail aan jullie en meestal ook in de ontvangstbevestiging aan de afzender.",
      type: "text",
      rows: 6,
      readOnly: true,
    }),
    defineField({
      name: "notify",
      title: "Wil op de hoogte blijven",
      description: "Aangevinkt op het formulier (“hou me op de hoogte”): deze persoon werd dan meteen ingeschreven voor de nieuwsbrief. Afmelden doe je in het Contactboek, niet hier.",
      type: "boolean",
      readOnly: true,
    }),
    defineField({
      name: "lang",
      title: "Taal",
      description: "De taal van de website (NL of EN) bij het versturen. De ontvangstbevestiging ging in deze taal; het contactboek gebruikt ze ook voor de nieuwsbrief.",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "submittedAt",
      title: "Verstuurd op",
      description: "Automatisch: wanneer het formulier op de website verstuurd werd. Enkel intern; bepaalt de volgorde “Nieuwste eerst”.",
      type: "datetime",
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: "Nieuwste eerst",
      name: "submittedDesc",
      by: [{ field: "submittedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      name: "name",
      subject: "subject",
      at: "submittedAt",
      status: "status",
    },
    prepare: ({ name, subject, at, status }) => ({
      title: name,
      subtitle: [subject, at?.slice(0, 10)].filter(Boolean).join(" · "),
      description: status ?? "new",
    }),
  },
  components: { preview: statusPreview(MESSAGE_STATUSES) },
});
