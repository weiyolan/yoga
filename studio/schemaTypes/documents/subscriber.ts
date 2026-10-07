import { BellIcon } from "@sanity/icons/Bell";
import { defineField, defineType } from "sanity";

/**
 * Newsletter subscriber (footer form, or "keep me posted" on the contact form).
 * `_id` = `subscriber.<hash of the e-mail>`: private (dotted id) and one document
 * per address, so signing up twice never makes a duplicate.
 */
export const subscriber = defineType({
  name: "subscriber",
  title: "Nieuwsbrief-inschrijving",
  type: "document",
  icon: BellIcon,
  liveEdit: true,
  fields: [
    defineField({ name: "email", title: "E-mail", type: "string", readOnly: true }),
    defineField({ name: "name", title: "Naam", type: "string", readOnly: true }),
    defineField({ name: "source", title: "Via", type: "string", readOnly: true, options: { list: [{ title: "Footer", value: "footer" }, { title: "Contactformulier", value: "contact" }] } }),
    defineField({ name: "lang", title: "Taal", type: "string", readOnly: true }),
    defineField({ name: "subscribedAt", title: "Ingeschreven op", type: "datetime", readOnly: true }),
    defineField({ name: "unsubscribed", title: "Uitgeschreven", type: "boolean", initialValue: false }),
  ],
  orderings: [{ title: "Nieuwste eerst", name: "subscribedDesc", by: [{ field: "subscribedAt", direction: "desc" }] }],
  preview: {
    select: { email: "email", at: "subscribedAt", off: "unsubscribed" },
    prepare: ({ email, at, off }) => ({ title: email, subtitle: [off ? "Uitgeschreven" : null, at?.slice(0, 10)].filter(Boolean).join(" · ") }),
  },
});
