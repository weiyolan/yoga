import { ClipboardIcon } from "@sanity/icons/Clipboard";
import { defineArrayMember, defineField, defineType } from "sanity";
import { defaultFields } from "../shared/default";
import { i18nLines, i18nString, i18nText, pick } from "../shared/i18n";

export const QUESTION_TYPES = [
  { title: "Korte tekst", value: "text" },
  { title: "Lange tekst", value: "textarea" },
  { title: "Ja / nee", value: "yesno" },
  { title: "Keuze (één)", value: "choice" },
  { title: "Meerdere keuzes", value: "multi" },
  { title: "Nieuwe stap (titel)", value: "section" },
  { title: "Kamerkeuze (uit de prijzen)", value: "room" },
  { title: "Dieet / allergieën", value: "diet" },
];

type Q = { type?: string } | undefined;

/**
 * Inschrijfformulier: the questions a retreat's sign-up form asks, on top of name and e-mail.
 * A retreat picks one (`retreat.signupForm`); empty = the form marked “Standaard”. Shared by
 * retreats of the same kind (e.g. “Yoga & Freediving”), so one fix applies everywhere.
 * Each sign-up stores a snapshot of the questions + answers: editing a form never changes old sign-ups.
 */
export const signupForm = defineType({
  name: "signupForm",
  title: "Inschrijfformulier",
  type: "document",
  icon: ClipboardIcon,
  fields: [
    defineField({ name: "name", title: "Naam", type: "string", description: "Intern, bv. “Yoga & Freediving”.", validation: (rule) => rule.required() }),
    ...defaultFields("signupForm", "signupForm", "formulier"),
    i18nText("intro", { title: "Intro", description: "Optioneel: tekst boven het formulier, bv. “Top dat je je wil inschrijven! Na je inschrijving sturen we de betaalgegevens.”" }),
    defineField({
      name: "intent",
      title: "Ook “nog niet inschrijven” aanbieden",
      type: "object",
      description: "Bovenaan: “Hoe wil je verdergaan?”. Wie niet inschrijft, vult enkel naam, e-mail en de vraag hieronder in: komt binnen als bericht (Contactformulier) en wordt ingeschreven voor de nieuwsbrief.",
      options: { columns: 2 },
      fields: [
        defineField({ name: "info", title: "“Ik twijfel nog: stuur me meer info”", type: "boolean", initialValue: false }),
        defineField({ name: "later", title: "“Ik kan deze keer niet: hou me op de hoogte”", type: "boolean", initialValue: false }),
        i18nString("question", { title: "Vraag voor wie niet inschrijft", description: "Leeg = “Welke soorten retreats interesseren je?”." }),
      ],
    }),
    defineField({
      name: "standard",
      title: "Standaardvragen",
      type: "object",
      description: "Naam en e-mail worden altijd gevraagd. Kamerkeuze en dieet kan je ook als vraag op een eigen plek zetten (met een eigen titel): dan staan ze daar.",
      options: { columns: 3 },
      fields: [
        defineField({ name: "phone", title: "GSM", type: "boolean", initialValue: true }),
        defineField({ name: "room", title: "Kamerkeuze", type: "boolean", initialValue: true, description: "Uit de prijzen van de retreat." }),
        defineField({ name: "diet", title: "Dieetwensen", type: "boolean", initialValue: true }),
      ],
    }),
    defineField({
      name: "questions",
      title: "Extra vragen",
      type: "array",
      description: "In deze volgorde, bv. “Ervaring met freediving?”. “Nieuwe stap” begint een nieuwe pagina van het formulier met die titel (zoals de secties in Google Forms).",
      of: [
        defineArrayMember({
          name: "signupQuestion",
          title: "Vraag",
          type: "object",
          fields: [
            defineField({ name: "type", title: "Soort", type: "string", options: { list: QUESTION_TYPES, layout: "radio", direction: "horizontal" }, initialValue: "text", validation: (rule) => rule.required() }),
            i18nString("label", { title: "Vraag (of titel)", required: true, max: 120 }),
            i18nString("help", { title: "Uitleg (optioneel)", max: 300, description: "Kleine tekst onder de vraag (of de titel van de stap)." }),
            i18nLines("options", { title: "Keuzes", hidden: ({ parent }) => !["choice", "multi"].includes((parent as Q)?.type ?? "") }),
            defineField({ name: "other", title: "Ook “Andere: …” (zelf invullen)", type: "boolean", initialValue: false, hidden: ({ parent }) => !["choice", "multi"].includes((parent as Q)?.type ?? "") }),
            defineField({ name: "required", title: "Verplicht", type: "boolean", initialValue: false, hidden: ({ parent }) => (parent as Q)?.type === "section" }),
            defineField({
              name: "showIf",
              title: "Enkel tonen als de vraag ervoor … is",
              type: "text",
              rows: 2,
              description: "Optioneel. Eén antwoord per lijn, zoals in de vorige vraag (Nederlands), bv. “Ja” of “Ja, graag” en “Misschien”. Leeg = altijd tonen.",
              hidden: ({ parent }) => (parent as Q)?.type === "section",
            }),
          ],
          preview: {
            select: { label: "label", type: "type", required: "required", showIf: "showIf" },
            prepare: ({ label, type, required, showIf }) => ({
              title: type === "section" ? `— ${pick(label) ?? "Stap"} —` : (pick(label) ?? "Vraag"),
              subtitle: [QUESTION_TYPES.find((q) => q.value === type)?.title, required ? "verplicht" : null, showIf ? `enkel als: ${String(showIf).split("\n").join(" / ")}` : null].filter(Boolean).join(" · "),
            }),
          },
        }),
      ],
    }),
    defineField({ name: "message", title: "Vragen of opmerkingen", type: "boolean", initialValue: true, description: "Open vak op het einde." }),
  ],
  preview: {
    select: { title: "name", isDefault: "isDefault", questions: "questions" },
    prepare: ({ title, isDefault, questions }) => ({
      title: title ?? "Formulier",
      subtitle: [isDefault ? "Standaard" : null, `${(questions as Q[] | undefined)?.filter((q) => q?.type !== "section").length ?? 0} extra vragen`].filter(Boolean).join(" · "),
    }),
  },
});
