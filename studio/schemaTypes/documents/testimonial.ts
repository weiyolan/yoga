import { CommentIcon } from "@sanity/icons/Comment";
import { defineField, defineType } from "sanity";
import { i18nString, i18nText, pick } from "../shared/i18n";

export const TESTIMONIAL_SOURCES = [
  { title: "Formulier", value: "form" },
  { title: "Zelf toegevoegd", value: "manual" },
];

export const stars = (n?: number | null) => (n ? "★".repeat(n) + "☆".repeat(5 - n) : "");

/**
 * What a participant says: on Home (“Op Home” on) and on the page of its retreat. One kind, two ways in:
 * typed in here (Bron “Zelf toegevoegd”), or sent with the form on the site, then “Gepubliceerd” on the
 * submission (`reviewSubmission`, private, with the e-mail) creates `testimonial-<uuid>` (Bron “Formulier”).
 */
export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  icon: CommentIcon,
  fields: [
    defineField({ name: "showOnHome", title: "Op Home", type: "boolean", initialValue: true, description: "Aan = in de slider “Wat deelnemers zeggen” op Home (max. 12, volgens Volgorde, dan de nieuwste). Ook aan/uit te zetten in Contact → Testimonials → Tabel." }),
    defineField({ name: "showOnRetreat", title: "Op de retreatpagina", type: "boolean", initialValue: true, description: "Aan = bij “Wat deelnemers zeggen” op de pagina van de retreat hieronder (en bij een volgende editie ervan).", hidden: ({ document }) => !document?.retreat }),
    defineField({
      name: "name",
      title: "Naam",
      type: "string",
      description: "Staat onder de tekst, bv. “Sofie” of “Sofie D.”. Vraag even of de persoon akkoord is.",
      validation: (rule) => [rule.required(), rule.custom((v?: string) => (/\[[^\]]*\]/.test(v ?? "") ? "Vul de echte naam in (nu nog “" + v + "”)" : true))],
    }),
    i18nText("quote", { title: "Tekst", required: true, max: 600, description: "In de woorden van de deelnemer. Leeg in het Engels = de originele tekst (of Vertalen met AI)." }),
    defineField({ name: "rating", title: "Score (1–5)", type: "number", description: "Optioneel: sterren bij de tekst. Leeg = geen sterren, en telt niet mee in het gemiddelde op de retreatpagina.", options: { list: [1, 2, 3, 4, 5] }, validation: (rule) => rule.integer().min(1).max(5) }),
    defineField({ name: "retreat", title: "Retreat", type: "reference", to: [{ type: "retreat" }], description: "Optioneel: over welke retreat het gaat. Onder de tekst staat dan bv. “Eifel 2025”, en de testimonial komt op die retreatpagina." }),
    i18nString("context", { title: "Of andere context", description: "Optioneel: eigen tekst naast de naam, bv. “Lessen”. Gaat voor op de retreat hierboven." }),
    defineField({ name: "date", title: "Datum", type: "datetime", initialValue: () => new Date().toISOString(), description: "Bepaalt de volgorde: de nieuwste eerst." }),
    defineField({ name: "orderRank", title: "Volgorde op Home", type: "number", description: "Optioneel: laag = eerst in de slider op Home. Leeg = na de genummerde, nieuwste eerst.", hidden: ({ document }) => !document?.showOnHome }),
    defineField({ name: "lang", title: "Taal", type: "string", description: "De taal waarin de tekst geschreven werd.", options: { list: [{ title: "Nederlands", value: "nl" }, { title: "English", value: "en" }] }, initialValue: "nl" }),
    defineField({ name: "source", title: "Bron", type: "string", options: { list: TESTIMONIAL_SOURCES }, initialValue: "manual", readOnly: true, description: "Formulier = via de website (de inzending met e-mail staat bij Contact → Testimonials → Inzendingen). Zelf toegevoegd = hier ingevuld." }),
  ],
  orderings: [
    { title: "Nieuwste eerst", name: "dateDesc", by: [{ field: "date", direction: "desc" }] },
    { title: "Volgorde op Home", name: "homeOrder", by: [{ field: "orderRank", direction: "asc" }, { field: "date", direction: "desc" }] },
  ],
  preview: {
    select: { quote: "quote", name: "name", rating: "rating", home: "showOnHome", retreat: "retreat.title", context: "context" },
    prepare: ({ quote, name, rating, home, retreat, context }) => ({
      title: [name, stars(rating)].filter(Boolean).join(" "),
      subtitle: [home ? "🏠 Home" : null, pick(context) ?? pick(retreat), pick(quote)?.slice(0, 60)].filter(Boolean).join(" · "),
    }),
  },
});
