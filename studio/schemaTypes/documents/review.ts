import { StarIcon } from "@sanity/icons/Star";
import { defineField, defineType } from "sanity";
import { statusPreview } from "../../components/StatusPreview";

export const REVIEW_STATUSES = [
  { title: "Nieuw", value: "new", tone: "primary" as const },
  { title: "Gepubliceerd", value: "approved", tone: "positive" as const },
  { title: "Geweigerd", value: "rejected", tone: "critical" as const },
];

const stars = (n?: number) => (n ? "★".repeat(n) + "☆".repeat(5 - n) : "");

/**
 * A review as sent with the form on the site (app/actions/forms.ts). Private: dotted `_id`
 * (`reviewSubmission.<uuid>`), it holds the e-mail. "Gepubliceerd" copies it, without e-mail,
 * to a public `review` (structure/views.ts); "Geweigerd" or "Nieuw" takes that copy offline again.
 */
export const reviewSubmission = defineType({
  name: "reviewSubmission",
  title: "Review (inzending)",
  type: "document",
  icon: StarIcon,
  liveEdit: true,
  fields: [
    defineField({ name: "status", title: "Status", description: "Wijzig via het tabblad “Overzicht”. “Gepubliceerd” zet de review (zonder e-mail) op de retreatpagina en, bij 4★ of meer, op de homepagina; “Geweigerd” of “Nieuw” haalt ze weer offline.", type: "string", options: { list: REVIEW_STATUSES.map(({ title, value }) => ({ title, value })) }, initialValue: "new", readOnly: true }),
    defineField({ name: "notes", title: "Interne notitie", description: "Enkel intern in de Studio: wordt nooit gepubliceerd. Handig om te noteren waarom je een review weigerde of aanpaste.", type: "text", rows: 3 }),
    defineField({ name: "retreat", title: "Retreat", description: "De retreat waarover de review gaat (het reviewformulier op de website hoort bij een retreat). Bij “Gepubliceerd” verschijnt de review op de pagina van deze retreat.", type: "reference", to: [{ type: "retreat" }], readOnly: true }),
    defineField({ name: "name", title: "Naam", description: "Ingevuld op het reviewformulier van de website. Bij “Gepubliceerd” verschijnt deze naam bij de review op de site; de schrijver gaf daar toestemming voor.", type: "string", readOnly: true }),
    defineField({ name: "email", title: "E-mail", description: "Ingevuld op het reviewformulier. Nooit publiek: de gepubliceerde review heeft geen e-mail. De ontvangstbevestiging ging naar dit adres en het komt in het contactboek.", type: "string", readOnly: true }),
    defineField({ name: "rating", title: "Score", description: "Het aantal sterren (1–5) gekozen op het reviewformulier. Verschijnt bij “Gepubliceerd” op de site; enkel reviews met 4★ of meer komen ook op de homepagina.", type: "number", readOnly: true }),
    defineField({ name: "text", title: "Review", description: "De review zoals geschreven op de website. Bij “Gepubliceerd” verschijnt deze tekst op de site; bijwerken doe je met de knop “Tekst op de site aanpassen” in het Overzicht.", type: "text", rows: 5, readOnly: true }),
    defineField({ name: "lang", title: "Taal", description: "De taal van de website (NL of EN) bij het versturen. De ontvangstbevestiging ging in deze taal; het contactboek gebruikt ze ook voor de nieuwsbrief.", type: "string", readOnly: true }),
    defineField({ name: "submittedAt", title: "Verstuurd op", description: "Automatisch: wanneer de review op de website verstuurd werd. Wordt bij publiceren de datum van de review en bepaalt de volgorde “Nieuwste eerst”.", type: "datetime", readOnly: true }),
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

/** The public copy of an approved review: shown on the retreat page and the Home page. No e-mail. */
export const review = defineType({
  name: "review",
  title: "Review",
  type: "document",
  icon: StarIcon,
  fields: [
    defineField({ name: "retreat", title: "Retreat", description: "Overgenomen bij “Gepubliceerd”. De review verschijnt op de pagina van deze retreat, en bij een volgende editie (zelfde eerste woord in de slug) als eerdere review.", type: "reference", to: [{ type: "retreat" }] }),
    defineField({ name: "name", title: "Naam", description: "Verschijnt bij de review op de website. Overgenomen uit de inzending; je mag het aanpassen (bv. enkel de voornaam), dat blijft bewaard bij opnieuw publiceren.", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "rating", title: "Score (1–5)", description: "Verschijnt als sterren bij de review op de website. Reviews met 4★ of meer komen ook op de homepagina.", type: "number", validation: (rule) => rule.required().integer().min(1).max(5) }),
    defineField({ name: "text", title: "Review", description: "De tekst zoals hij op de website verschijnt (retreatpagina en eventueel homepagina). Je mag hem hier bijwerken, bv. een tikfout verbeteren.", type: "text", rows: 5, validation: (rule) => rule.required().max(1200) }),
    defineField({ name: "lang", title: "Taal", description: "De taal waarin de review geschreven werd, overgenomen uit de inzending. Enkel ter info: de review verschijnt in beide talen van de site.", type: "string", options: { list: [{ title: "Nederlands", value: "nl" }, { title: "English", value: "en" }] } }),
    defineField({ name: "submittedAt", title: "Datum", description: "Datum van de review, overgenomen uit de inzending. Bepaalt de volgorde op de website: de nieuwste reviews staan eerst.", type: "datetime" }),
  ],
  orderings: [{ title: "Nieuwste eerst", name: "submittedDesc", by: [{ field: "submittedAt", direction: "desc" }] }],
  preview: {
    select: { name: "name", rating: "rating", text: "text", retreat: "retreat.slug.current" },
    prepare: ({ name, rating, text, retreat }) => ({ title: `${stars(rating)} ${name ?? ""}`, subtitle: [retreat, text?.slice(0, 80)].filter(Boolean).join(" · ") }),
  },
});
