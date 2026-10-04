import { ActivityIcon } from "@sanity/icons/Activity";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nText } from "../shared/i18n";
import { mediaField } from "../shared/media";

/** A style Rita teaches: Ashtanga, Vinyasa, Pilates Mat, Pilates Reformer. */
export const yogaClass = defineType({
  name: "yogaClass",
  title: "Lesstijl",
  type: "document",
  icon: ActivityIcon,
  fields: [
    defineField({ name: "name", title: "Naam", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "name" }, validation: (rule) => rule.required() }),
    mediaField("photo", { title: "Foto", required: true }),
    i18nText("what", { title: "Wat is het?", required: true, max: 160 }),
    i18nText("forWhom", { title: "Voor wie?", required: true, max: 160 }),
    defineField({
      name: "studios",
      title: "Waar?",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "studio" }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({ name: "orderRank", title: "Volgorde", type: "number", initialValue: 10, description: "Laag = eerst." }),
  ],
  orderings: [{ title: "Volgorde", name: "orderRank", by: [{ field: "orderRank", direction: "asc" }] }],
  preview: { select: { title: "name", media: "photo.image" } },
});
