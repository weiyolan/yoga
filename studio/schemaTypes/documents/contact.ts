import { BookIcon } from "@sanity/icons/Book";
import { defineField, defineType } from "sanity";

/**
 * A contact added by hand or by CSV import in Binnengekomen → Contactboek (components/ContactBook.tsx).
 * `_id` = `contact.<hash of the e-mail>`: private (dotted id), one per address. Whether they get the
 * newsletter is their `subscriber` document, like everyone else.
 */
export const contact = defineType({
  name: "contact",
  title: "Contact",
  type: "document",
  icon: BookIcon,
  liveEdit: true,
  fields: [
    defineField({ name: "name", title: "Naam", type: "string" }),
    defineField({ name: "email", title: "E-mail", type: "string", readOnly: true }),
    defineField({ name: "phone", title: "GSM", type: "string" }),
    defineField({ name: "lang", title: "Taal", type: "string", options: { list: [{ title: "Nederlands", value: "nl" }, { title: "English", value: "en" }], layout: "radio", direction: "horizontal" }, initialValue: "nl" }),
    defineField({ name: "notes", title: "Notitie", type: "text", rows: 3 }),
    defineField({ name: "source", title: "Via", type: "string", readOnly: true, options: { list: [{ title: "Met de hand", value: "manual" }, { title: "CSV-import", value: "csv" }] } }),
    defineField({ name: "addedAt", title: "Toegevoegd op", type: "datetime", readOnly: true }),
  ],
  preview: {
    select: { name: "name", email: "email" },
    prepare: ({ name, email }) => ({ title: name || email, subtitle: name ? email : undefined }),
  },
});
