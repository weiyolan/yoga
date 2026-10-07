import { LockIcon } from "@sanity/icons/Lock";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nString, i18nText, pick } from "../shared/i18n";

/** Privacyverklaring (footer link, sign-up consent). Sections: a heading + plain paragraphs. */
export const privacyPage = defineType({
  name: "privacyPage",
  title: "Privacyverklaring",
  type: "document",
  icon: LockIcon,
  fields: [
    i18nString("title", { title: "Titel", required: true }),
    i18nText("intro", { title: "Intro" }),
    defineField({
      name: "sections",
      title: "Onderdelen",
      type: "array",
      of: [
        defineArrayMember({
          name: "privacySection",
          title: "Onderdeel",
          type: "object",
          fields: [i18nString("title", { title: "Kop", required: true }), i18nText("text", { title: "Tekst", description: "Lege lijn = nieuwe paragraaf." })],
          preview: { select: { title: "title" }, prepare: ({ title }) => ({ title: pick(title) }) },
        }),
      ],
    }),
    defineField({ name: "updatedAt", title: "Laatst bijgewerkt", type: "date", options: { dateFormat: "D MMMM YYYY" } }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Privacyverklaring" }) },
});
