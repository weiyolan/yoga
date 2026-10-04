import { CommentIcon } from "@sanity/icons/Comment";
import { defineField, defineType } from "sanity";
import { i18nString, i18nText, pick } from "../shared/i18n";

/** A short quote from a participant. Picked on the Home page (max. 3). */
export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  icon: CommentIcon,
  fields: [
    i18nText("quote", { title: "Citaat", required: true, max: 200 }),
    defineField({ name: "name", title: "Naam", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "retreat", title: "Retreat", type: "reference", to: [{ type: "retreat" }], description: "Toont bv. “Eifel 2025” onder het citaat." }),
    i18nString("context", { title: "Of andere context", description: "Als het niet over een retreat gaat, bv. “Lessen”." }),
  ],
  preview: {
    select: { quote: "quote", name: "name", retreat: "retreat.title" },
    prepare: ({ quote, name, retreat }) => ({ title: pick(quote), subtitle: [name, pick(retreat)].filter(Boolean).join(" · ") }),
  },
});
