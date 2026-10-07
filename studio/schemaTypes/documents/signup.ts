import { UsersIcon } from "@sanity/icons/Users";
import { defineField, defineType } from "sanity";
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
 * Shown as a readable card first (components/SignupView); "Bevestigd" counts towards `retreat.booked`.
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
    defineField({ name: "persons", title: "Aantal personen", type: "number", readOnly: true }),
    defineField({ name: "room", title: "Kamer / prijs", type: "string", readOnly: true }),
    defineField({ name: "diet", title: "Dieetwensen of allergieën", type: "text", rows: 2, readOnly: true }),
    defineField({ name: "message", title: "Vragen of opmerkingen", type: "text", rows: 3, readOnly: true }),
    defineField({ name: "waitlist", title: "Aanvraag voor de wachtlijst (retreat was volzet)", type: "boolean", readOnly: true }),
    defineField({ name: "lang", title: "Taal", type: "string", readOnly: true }),
    defineField({ name: "consent", title: "Akkoord gegevens", type: "boolean", readOnly: true }),
    defineField({ name: "submittedAt", title: "Ingeschreven op", type: "datetime", readOnly: true }),
  ],
  orderings: [{ title: "Nieuwste eerst", name: "submittedDesc", by: [{ field: "submittedAt", direction: "desc" }] }],
  preview: {
    select: { name: "name", persons: "persons", status: "status", retreat: "retreat.slug.current", at: "submittedAt" },
    prepare: ({ name, persons, status, retreat, at }) => ({
      title: [name, persons > 1 ? `(+${persons - 1})` : null].filter(Boolean).join(" "),
      subtitle: [SIGNUP_STATUSES.find((s) => s.value === status)?.title, retreat, at?.slice(0, 10)].filter(Boolean).join(" · "),
    }),
  },
});
