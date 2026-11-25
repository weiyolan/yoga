import { StarIcon } from "@sanity/icons/Star";
import { defineArrayMember, defineField, defineType } from "sanity";
import { defaultFields } from "../shared/default";
import { i18nLines, i18nString, i18nText, pick } from "../shared/i18n";
import { REVIEW_QUESTION_TYPES, reviewQuestionType, ReviewQuestionTypeInput, ShowIfInput } from "../../components/FormBuilder";

type Q = { type?: string } | undefined;
const typeOf = (parent: unknown) => (parent as Q)?.type ?? "";
const only = (...types: string[]) => ({ parent }: { parent?: unknown }) => !types.includes(typeOf(parent));

/**
 * Feedbackformulier: the questions of a retreat's review page (/retreats/<slug>/review), like a Google Form.
 * A retreat picks one (`retreat.reviewForm`, tab Achteraf); empty = the one marked “Standaard”; none at all =
 * the short built-in form (stars, name, e-mail, text). Only a published form shows on the site.
 * Each answer is stored as a snapshot on the submission (Testimonials → Inzendingen); the “Resultaten” tab
 * sums them up per retreat. The `quote` answer becomes the testimonial when the team publishes it.
 */
export const reviewForm = defineType({
  name: "reviewForm",
  title: "Feedbackformulier",
  type: "document",
  icon: StarIcon,
  fields: [
    defineField({ name: "name", title: "Naam", type: "string", description: "Niet op de site: om het formulier te kiezen bij een retreat (tab Achteraf) en terug te vinden, bv. “Evaluatie weekendretreat”.", validation: (rule) => rule.required() }),
    ...defaultFields("reviewForm", "reviewForm", "feedbackformulier", undefined, "Achteraf"),
    i18nString("title", { title: "Titel op de pagina", max: 90, description: "De grote titel bovenaan het feedbackformulier, bv. “Evaluatie Yoga Retreat {retreat}” ({retreat} = de naam van de retreat). Leeg = “Vertel hoe het was” + de naam van de retreat." }),
    i18nText("intro", { title: "Intro", max: 600, description: "Tekst bovenaan het formulier, onder de titel, bv. “Bedankt dat je erbij was! … Het invullen duurt 3 minuutjes.”" }),
    defineField({
      name: "questions",
      title: "Vragen",
      type: "array",
      description: "De vragen van het feedbackformulier, in deze volgorde (één pagina, zoals Google Forms). “Nieuw deel” zet een tussentitel. Tip: “Quote voor de site” + “Toestemming publicatie” + “Naam” maken er een testimonial van die je met één klik publiceert.",
      validation: (rule) => rule.min(1),
      of: [
        defineArrayMember({
          name: "reviewQuestion",
          title: "Vraag",
          type: "object",
          fields: [
            defineField({
              name: "type",
              title: "Soort",
              type: "string",
              options: { list: REVIEW_QUESTION_TYPES.map(({ title, value }) => ({ title, value })) },
              components: { input: ReviewQuestionTypeInput },
              initialValue: "text",
              description: "Hoe de vraag op het formulier verschijnt.",
              validation: (rule) => rule.required(),
            }),
            i18nString("label", { title: "Vraag (of titel)", required: true, max: 220, description: "De vraag zoals ze op het formulier staat (bij “Nieuw deel”: de tussentitel). Ook de titel bij het antwoord in de inzending en de resultaten." }),
            i18nString("help", { title: "Uitleg (optioneel)", max: 300, description: "Kleine tekst onder de vraag, bv. “1 = helemaal niet waarschijnlijk | 10 = zeer waarschijnlijk”." }),
            i18nLines("rows", { title: "Rijen", description: "Raster: de onderdelen die ze elk een antwoord geven, bv. “Organisatie & begeleiding”, “De maaltijden”.", hidden: only("grid") }),
            i18nLines("options", {
              title: "Keuzes (bij een raster: de kolommen)",
              description: "De antwoorden waaruit ze kunnen kiezen. Raster: de kolommen, van slecht naar goed (bv. Niet goed … Uitstekend, n.v.t.). Toestemming publicatie: precies 3 lijnen, in deze volgorde: met voornaam / anoniem / niet publiceren ({retreat} = de naam van de retreat; leeg = de standaardteksten).",
              hidden: only("choice", "multi", "grid", "publish"),
            }),
            defineField({ name: "other", title: "Ook “Andere: …” (zelf invullen)", type: "boolean", initialValue: false, description: "Aan = onder de keuzes staat ook “Andere:” met een vakje om zelf iets in te vullen.", hidden: only("choice", "multi") }),
            defineField({
              name: "scaleMax",
              title: "Tot",
              type: "number",
              initialValue: 5,
              options: { list: [3, 4, 5, 6, 7, 10].map((n) => ({ title: `1 – ${n}`, value: n })), layout: "radio", direction: "horizontal" },
              description: "Schaal of sterren: van 1 tot dit getal. Bij sterren: de eerste sterrenvraag is de score (omgerekend naar 5 sterren) van de testimonial.",
              hidden: only("scale", "stars"),
            }),
            i18nString("low", { title: "Woord bij 1", max: 40, description: "Schaal: links van de cijfers, bv. “Niet in verhouding”.", hidden: only("scale") }),
            i18nString("high", { title: "Woord bij het hoogste cijfer", max: 40, description: "Schaal: rechts van de cijfers, bv. “Uitstekende prijs-kwaliteit”.", hidden: only("scale") }),
            defineField({ name: "required", title: "Verplicht", type: "boolean", initialValue: false, description: "Aan = deze vraag moet ingevuld zijn voor ze kunnen versturen (bij een raster: elke rij).", hidden: ({ parent }) => typeOf(parent) === "section" }),
            defineField({
              name: "showIf",
              title: "Enkel tonen als de vraag hierboven … is",
              type: "text",
              rows: 2,
              description: "Optioneel: vink de antwoorden aan waarbij deze vraag verschijnt (bv. “Jouw voornaam” enkel bij “Met mijn voornaam”). Niets aangevinkt = altijd tonen.",
              components: { input: ShowIfInput },
              hidden: ({ parent }) => typeOf(parent) === "section",
            }),
          ],
          preview: {
            select: { label: "label", type: "type", required: "required", showIf: "showIf", options: "options", rows: "rows", scaleMax: "scaleMax" },
            prepare: ({ label, type, required, showIf, options, rows, scaleMax }) => {
              const t = reviewQuestionType(type);
              const count = (v: unknown) => (pick(v as never) ?? "").split("\n").filter((o: string) => o.trim()).length;
              const detail =
                type === "grid" ? `${count(rows)} rijen × ${count(options)} kolommen` : type === "scale" || type === "stars" ? `1 – ${scaleMax ?? 5}` : count(options) ? `${count(options)} keuzes` : null;
              return {
                title: type === "section" ? `DEEL · ${(pick(label) ?? "Nieuw deel").toUpperCase()}` : `${showIf ? "↳ " : ""}${pick(label) ?? "Nieuwe vraag"}${required ? " *" : ""}`,
                subtitle: type === "section" ? "Tussentitel" : [t?.title, detail, showIf ? `enkel als: ${String(showIf).split("\n").join(" / ")}` : null].filter(Boolean).join(" · "),
                media: t?.icon,
              };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "name", isDefault: "isDefault", questions: "questions" },
    prepare: ({ title, isDefault, questions }) => ({
      title: title ?? "Feedbackformulier",
      subtitle: [isDefault ? "Standaard" : null, `${(questions as Q[] | undefined)?.filter((q) => q?.type !== "section").length ?? 0} vragen`].filter(Boolean).join(" · "),
    }),
  },
});
