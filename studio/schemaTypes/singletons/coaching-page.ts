import { HeartIcon } from "@sanity/icons/Heart";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nString, i18nText, pick } from "../shared/i18n";
import { mediaArrayField } from "../shared/media";

export const coachingPage = defineType({
  name: "coachingPage",
  title: "Coaching-pagina",
  type: "document",
  icon: HeartIcon,
  fields: [
    defineField({ name: "hero", title: "Openingsbeeld", type: "hero", validation: (rule) => rule.required() }),
    defineField({
      name: "blocks",
      title: "Blokken",
      type: "array",
      description: "Wat · wat kan je verwachten · duur & prijs.",
      of: [
        defineArrayMember({
          name: "coachingBlock",
          title: "Blok",
          type: "object",
          fields: [
            i18nString("label", { title: "Label" }),
            i18nString("title", { title: "Kop", required: true }),
            i18nText("text", { title: "Tekst", max: 300 }),
          ],
          preview: { select: { title: "title", label: "label" }, prepare: ({ title, label }) => ({ title: pick(title), subtitle: pick(label) }) },
        }),
      ],
      validation: (rule) => rule.max(3).warning("Max. 3 blokken"),
    }),
    mediaArrayField("photos", { title: "Foto's", max: 4 }),
    i18nString("ctaTitle", { title: "Afsluiter: kop", description: "bv. “Zin in een gesprek?”." }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Private coaching" }) },
});
