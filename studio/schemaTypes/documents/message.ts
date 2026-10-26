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
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "name",
      title: "Naam",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "email",
      title: "E-mail",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "phone",
      title: "GSM",
      type: "string",
      readOnly: true,
      hidden: ({ value }) => !value,
    }),
    defineField({
      name: "retreat",
      title: "Over retreat",
      type: "reference",
      to: [{ type: "retreat" }],
      readOnly: true,
      hidden: ({ value }) => !value,
      description:
        "Via het inschrijfformulier: “meer info” of “hou me op de hoogte”.",
    }),
    defineField({
      name: "subject",
      title: "Onderwerp",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "message",
      title: "Bericht",
      type: "text",
      rows: 6,
      readOnly: true,
    }),
    defineField({
      name: "notify",
      title: "Wil op de hoogte blijven",
      type: "boolean",
      readOnly: true,
    }),
    defineField({
      name: "lang",
      title: "Taal",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "submittedAt",
      title: "Verstuurd op",
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
