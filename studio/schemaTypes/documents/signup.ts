import { UsersIcon } from "@sanity/icons/Users";
import { defineArrayMember, defineField, defineType } from "sanity";
import { StatusInput } from "../../components/StatusInput";

export const SIGNUP_STATUSES = [
  { title: "Nieuw", value: "new" },
  { title: "Bevestigd", value: "confirmed" },
  { title: "Wachtlijst", value: "waitlist" },
  { title: "Geannuleerd", value: "cancelled" },
];

/**
 * A retreat sign-up from the form on the retreat page (app/actions/forms.ts).
 * Created with a dotted `_id` (`signup.<uuid>`): documents under a path are never
 * returned by the public API, so personal data stays private in a public dataset.
 * Not creatable from the Studio (that would give a public id). Only status and notes are editable.
 * Always one person per sign-up. Shown as a readable card first (components/SignupView);
 * "Bevestigd" counts towards `retreat.booked`. `answers` is a snapshot of the retreat's form questions.
 */
export const signup = defineType({
  name: "signup",
  title: "Inschrijving",
  type: "document",
  icon: UsersIcon,
  liveEdit: true,
  fields: [
    defineField({ name: "status", title: "Status", type: "string", options: { list: SIGNUP_STATUSES, layout: "radio", direction: "horizontal" }, initialValue: "new", components: { input: StatusInput } }),
    defineField({ name: "notes", title: "Interne notitie", type: "text", rows: 3 }),
    defineField({ name: "retreat", title: "Retreat", type: "reference", to: [{ type: "retreat" }], readOnly: true }),
    defineField({ name: "name", title: "Naam", type: "string", readOnly: true }),
    defineField({ name: "email", title: "E-mail", type: "string", readOnly: true }),
    defineField({ name: "phone", title: "GSM", type: "string", readOnly: true }),
    defineField({ name: "persons", title: "Aantal personen (oude inschrijvingen)", type: "number", readOnly: true, hidden: ({ value }) => !value || value === 1 }),
    defineField({ name: "room", title: "Kamer / prijs", type: "string", readOnly: true }),
    defineField({ name: "diet", title: "Dieetwensen of allergieën", type: "text", rows: 2, readOnly: true }),
    defineField({ name: "message", title: "Vragen of opmerkingen", type: "text", rows: 3, readOnly: true }),
    defineField({
      name: "answers",
      title: "Antwoorden op de extra vragen",
      type: "array",
      readOnly: true,
      description: "Kopie van de vragen zoals ze op het moment van inschrijven waren.",
      of: [
        defineArrayMember({
          name: "signupAnswer",
          type: "object",
          fields: [
            defineField({ name: "question", title: "Vraag", type: "string" }),
            defineField({ name: "answer", title: "Antwoord", type: "text", rows: 2 }),
          ],
          preview: { select: { title: "question", subtitle: "answer" } },
        }),
      ],
    }),
    defineField({ name: "form", title: "Formulier", type: "string", readOnly: true, hidden: ({ value }) => !value }),
    defineField({ name: "waitlist", title: "Aanvraag voor de wachtlijst (retreat was volzet)", type: "boolean", readOnly: true }),
    defineField({ name: "lang", title: "Taal", type: "string", readOnly: true }),
    defineField({ name: "consent", title: "Akkoord gegevens", type: "boolean", readOnly: true }),
    defineField({ name: "terms", title: "Akkoord voorwaarden & annulatie", type: "boolean", readOnly: true }),
    defineField({ name: "submittedAt", title: "Ingeschreven op", type: "datetime", readOnly: true }),
    defineField({ name: "confirmedAt", title: "Bevestigingsmail verstuurd op", type: "datetime", readOnly: true, hidden: ({ value }) => !value, description: "Automatisch, of via “Bevestigingsmail” (geopend in je mailprogramma)." }),
  ],
  orderings: [{ title: "Nieuwste eerst", name: "submittedDesc", by: [{ field: "submittedAt", direction: "desc" }] }],
  preview: {
    select: { name: "name", status: "status", retreat: "retreat.slug.current", at: "submittedAt" },
    prepare: ({ name, status, retreat, at }) => ({
      title: name,
      subtitle: [SIGNUP_STATUSES.find((s) => s.value === status)?.title, retreat, at?.slice(0, 10)].filter(Boolean).join(" · "),
    }),
  },
});
