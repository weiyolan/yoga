import { StarIcon } from "@sanity/icons/Star";
import { defineField, defineType } from "sanity";

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
    defineField({ name: "status", title: "Status", type: "string", options: { list: REVIEW_STATUSES.map(({ title, value }) => ({ title, value })) }, initialValue: "new", readOnly: true, description: "Wijzig via het tabblad Overzicht." }),
    defineField({ name: "notes", title: "Interne notitie", type: "text", rows: 3 }),
    defineField({ name: "retreat", title: "Retreat", type: "reference", to: [{ type: "retreat" }], readOnly: true }),
    defineField({ name: "name", title: "Naam", type: "string", readOnly: true }),
    defineField({ name: "email", title: "E-mail", type: "string", readOnly: true }),
    defineField({ name: "rating", title: "Score", type: "number", readOnly: true }),
    defineField({ name: "text", title: "Review", type: "text", rows: 5, readOnly: true }),
    defineField({ name: "lang", title: "Taal", type: "string", readOnly: true }),
    defineField({ name: "submittedAt", title: "Verstuurd op", type: "datetime", readOnly: true }),
  ],
  orderings: [{ title: "Nieuwste eerst", name: "submittedDesc", by: [{ field: "submittedAt", direction: "desc" }] }],
  preview: {
    select: { name: "name", rating: "rating", status: "status", retreat: "retreat.slug.current", at: "submittedAt" },
    prepare: ({ name, rating, status, retreat, at }) => ({
      title: `${name ?? "Review"} ${stars(rating)}`,
      subtitle: [REVIEW_STATUSES.find((s) => s.value === status)?.title, retreat, at?.slice(0, 10)].filter(Boolean).join(" · "),
    }),
  },
});

/** The public copy of an approved review: shown on the retreat page and the Home page. No e-mail. */
export const review = defineType({
  name: "review",
  title: "Review",
  type: "document",
  icon: StarIcon,
  fields: [
    defineField({ name: "retreat", title: "Retreat", type: "reference", to: [{ type: "retreat" }] }),
    defineField({ name: "name", title: "Naam", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "rating", title: "Score (1–5)", type: "number", validation: (rule) => rule.required().integer().min(1).max(5) }),
    defineField({ name: "text", title: "Review", type: "text", rows: 5, validation: (rule) => rule.required().max(1200) }),
    defineField({ name: "lang", title: "Taal", type: "string", options: { list: [{ title: "Nederlands", value: "nl" }, { title: "English", value: "en" }] } }),
    defineField({ name: "submittedAt", title: "Datum", type: "datetime" }),
  ],
  orderings: [{ title: "Nieuwste eerst", name: "submittedDesc", by: [{ field: "submittedAt", direction: "desc" }] }],
  preview: {
    select: { name: "name", rating: "rating", text: "text", retreat: "retreat.slug.current" },
    prepare: ({ name, rating, text, retreat }) => ({ title: `${stars(rating)} ${name ?? ""}`, subtitle: [retreat, text?.slice(0, 80)].filter(Boolean).join(" · ") }),
  },
});
