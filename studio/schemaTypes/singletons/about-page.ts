import { UsersIcon } from "@sanity/icons/Users";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nString, i18nText, pick } from "../shared/i18n";

export const aboutPage = defineType({
  name: "aboutPage",
  title: "Over ons-pagina",
  type: "document",
  icon: UsersIcon,
  fields: [
    defineField({ name: "hero", title: "Openingsbeeld", type: "hero", validation: (rule) => rule.required() }),
    defineField({
      name: "founders",
      title: "Team",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "person" }] })],
      validation: (rule) => [rule.required(), rule.unique()],
    }),
    i18nString("principlesTitle", { title: "Principes: kop" }),
    defineField({
      name: "principles",
      title: "Principes (optioneel)",
      type: "array",
      of: [
        defineArrayMember({
          name: "principle",
          title: "Principe",
          type: "object",
          fields: [i18nString("title", { title: "Kop", required: true }), i18nText("text", { title: "Tekst", max: 200 })],
          preview: { select: { title: "title" }, prepare: ({ title }) => ({ title: pick(title) }) },
        }),
      ],
      validation: (rule) => rule.max(3).warning("Max. 3 principes"),
    }),
    defineField({ name: "principlesVideoUrl", title: "Video bij principes (optioneel)", type: "url", description: "Trage loop via Vimeo of Mux." }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Over ons" }) },
});
