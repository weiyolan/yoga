import { StarIcon } from "@sanity/icons/Star";
import { defineArrayMember, defineField, defineType } from "sanity";
import { statusPreview } from "../../components/StatusPreview";
import { stars } from "./testimonial";

export const REVIEW_STATUSES = [
  { title: "Nieuw", value: "new", tone: "primary" as const },
  { title: "Gepubliceerd", value: "approved", tone: "positive" as const },
  { title: "Geweigerd", value: "rejected", tone: "critical" as const },
];


/**
 * A testimonial as sent with the form on the site (app/actions/forms.ts). Private: dotted `_id`
 * (`reviewSubmission.<uuid>`), it holds the e-mail. "Gepubliceerd" copies it, without e-mail,
 * to a public `testimonial-<uuid>` (structure/views.tsx); "Geweigerd" or "Nieuw" takes that copy offline again.
 */
export const reviewSubmission = defineType({
  name: "reviewSubmission",
  title: "Testimonial (inzending)",
  type: "document",
  icon: StarIcon,
  liveEdit: true,
  fields: [
    defineField({ name: "status", title: "Status", description: "Wijzig via het tabblad “Overzicht”. “Gepubliceerd” maakt er een testimonial van (zonder e-mail) op de retreatpagina en, bij 4★ of meer, met “Op Home” aan; “Geweigerd” of “Nieuw” haalt ze weer offline.", type: "string", options: { list: REVIEW_STATUSES.map(({ title, value }) => ({ title, value })) }, initialValue: "new", readOnly: true }),
    defineField({ name: "notes", title: "Interne notitie", description: "Enkel intern in de Studio: wordt nooit gepubliceerd. Handig om te noteren waarom je een review weigerde of aanpaste.", type: "text", rows: 3 }),
    defineField({ name: "retreat", title: "Retreat", description: "De retreat waarover de review gaat (het reviewformulier op de website hoort bij een retreat). Bij “Gepubliceerd” verschijnt de testimonial op de pagina van deze retreat.", type: "reference", to: [{ type: "retreat" }], readOnly: true }),
    defineField({ name: "name", title: "Naam", description: "Ingevuld op het reviewformulier van de website. Bij “Gepubliceerd” verschijnt deze naam bij de review op de site; de schrijver gaf daar toestemming voor.", type: "string", readOnly: true }),
    defineField({ name: "email", title: "E-mail", description: "Ingevuld op het reviewformulier. Nooit publiek: de testimonial op de site heeft geen e-mail. De ontvangstbevestiging ging naar dit adres en het komt in het contactboek.", type: "string", readOnly: true }),
    defineField({ name: "rating", title: "Score", description: "Het aantal sterren (1–5) gekozen op het reviewformulier. Verschijnt bij “Gepubliceerd” op de site; bij 4★ of meer staat “Op Home” meteen aan.", type: "number", readOnly: true }),
    defineField({ name: "text", title: "Review", description: "De review zoals geschreven op de website. Bij “Gepubliceerd” verschijnt deze tekst op de site; bijwerken doe je in de testimonial (knop “Testimonial openen” in het Overzicht).", type: "text", rows: 5, readOnly: true }),
    defineField({
      name: "publish",
      title: "Mag op de site",
      description: "Feedbackformulier met “Toestemming publicatie”: wat de schrijver koos. Met voornaam = hun naam bij de testimonial; anoniem = “Deelnemer <retreat>”; niet publiceren = enkel voor jullie (Gepubliceerd kan dan niet).",
      type: "string",
      options: { list: [{ title: "Met voornaam", value: "name" }, { title: "Anoniem", value: "anonymous" }, { title: "Niet publiceren", value: "private" }] },
      readOnly: true,
    }),
    defineField({ name: "formId", title: "Formulier-id", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "form", title: "Formulier", description: "Het feedbackformulier waarmee dit verstuurd werd (leeg = het korte standaard-reviewformulier).", type: "string", readOnly: true }),
    defineField({
      name: "answers",
      title: "Antwoorden",
      description: "Alle antwoorden op het feedbackformulier, met een kopie van de vragen zoals ze toen waren (in het Nederlands). Het formulier later aanpassen verandert dit niet. Samengevat per retreat in Formulieren → het feedbackformulier → Resultaten.",
      type: "array",
      readOnly: true,
      of: [
        defineArrayMember({
          name: "reviewAnswer",
          type: "object",
          fields: [
            defineField({ name: "question", title: "Vraag", type: "string" }),
            defineField({ name: "row", title: "Rij (raster)", type: "string" }),
            defineField({ name: "answer", title: "Antwoord", type: "text", rows: 2 }),
            defineField({ name: "qKey", title: "Vraag-id", type: "string", hidden: true }),
            defineField({ name: "type", title: "Soort", type: "string", hidden: true }),
            defineField({ name: "rowIndex", title: "Rij-nummer", type: "number", hidden: true }),
            defineField({ name: "value", title: "Waarde", type: "number", hidden: true }),
          ],
          preview: { select: { title: "question", row: "row", answer: "answer" }, prepare: ({ title, row, answer }) => ({ title: row ? `${title} · ${row}` : title, subtitle: answer }) },
        }),
      ],
    }),
    defineField({ name: "lang", title: "Taal", description: "De taal van de website (NL of EN) bij het versturen. De ontvangstbevestiging ging in deze taal; het contactboek gebruikt ze ook voor de nieuwsbrief.", type: "string", readOnly: true }),
    defineField({ name: "submittedAt", title: "Verstuurd op", description: "Automatisch: wanneer de review op de website verstuurd werd. Wordt bij publiceren de datum van de testimonial en bepaalt de volgorde “Nieuwste eerst”.", type: "datetime", readOnly: true }),
  ],
  orderings: [{ title: "Nieuwste eerst", name: "submittedDesc", by: [{ field: "submittedAt", direction: "desc" }] }],
  preview: {
    select: { name: "name", rating: "rating", status: "status", retreat: "retreat.slug.current", at: "submittedAt" },
    prepare: ({ name, rating, status, retreat, at }) => ({
      title: `${name ?? "Review"} ${stars(rating)}`,
      subtitle: [retreat, at?.slice(0, 10)].filter(Boolean).join(" · "),
      description: status ?? "new", // → the badge (components/StatusPreview.tsx)
    }),
  },
  components: { preview: statusPreview(REVIEW_STATUSES) },
});
