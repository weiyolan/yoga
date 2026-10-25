import { ClipboardIcon } from "@sanity/icons/Clipboard";
import { defineArrayMember, defineField, defineType } from "sanity";
import { defaultFields } from "../shared/default";
import { i18nLines, i18nString, pick } from "../shared/i18n";

export const QUESTION_TYPES = [
  { title: "Korte tekst", value: "text" },
  { title: "Lange tekst", value: "textarea" },
  { title: "Ja / nee", value: "yesno" },
  { title: "Keuze", value: "choice" },
];

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
    defineField({
      name: "standard",
      title: "Standaardvragen",
      type: "object",
      description: "Naam en e-mail worden altijd gevraagd.",
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
      description: "In deze volgorde, bv. “Ervaring met freediving?”.",
      of: [
        defineArrayMember({
          name: "signupQuestion",
          title: "Vraag",
          type: "object",
          fields: [
            i18nString("label", { title: "Vraag", required: true, max: 120 }),
            i18nString("help", { title: "Uitleg (optioneel)", max: 160, description: "Kleine tekst onder de vraag." }),
            defineField({ name: "type", title: "Soort antwoord", type: "string", options: { list: QUESTION_TYPES, layout: "radio", direction: "horizontal" }, initialValue: "text", validation: (rule) => rule.required() }),
            i18nLines("options", { title: "Keuzes", hidden: ({ parent }) => (parent as { type?: string } | undefined)?.type !== "choice" }),
            defineField({ name: "required", title: "Verplicht", type: "boolean", initialValue: false }),
          ],
          preview: {
            select: { label: "label", type: "type", required: "required" },
            prepare: ({ label, type, required }) => ({ title: pick(label) ?? "Vraag", subtitle: [QUESTION_TYPES.find((q) => q.value === type)?.title, required ? "verplicht" : null].filter(Boolean).join(" · ") }),
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
      subtitle: [isDefault ? "Standaard" : null, `${(questions as unknown[] | undefined)?.length ?? 0} extra vragen`].filter(Boolean).join(" · "),
    }),
  },
});
