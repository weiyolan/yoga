import { ActivityIcon } from "@sanity/icons/Activity";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nLines, i18nString, i18nText } from "../shared/i18n";
import { mediaField } from "../shared/media";

/** A style Rita teaches: Ashtanga, Vinyasa, Pilates Mat, Pilates Reformer. */
export const yogaClass = defineType({
  name: "yogaClass",
  title: "Lesstijl",
  type: "document",
  icon: ActivityIcon,
  groups: [
    { name: "tile", title: "Tegel", default: true },
    { name: "page", title: "Lessen-pagina" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Naam",
      type: "string",
      group: ["tile", "page"],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      group: "tile",
      validation: (rule) => rule.required(),
    }),
    mediaField("photo", { title: "Foto", group: "tile", required: true }),
    i18nText("what", {
      title: "Wat is het?",
      group: "tile",
      required: true,
      max: 160,
    }),
    i18nText("forWhom", {
      title: "Voor wie?",
      group: "tile",
      required: true,
      max: 160,
    }),
    /* The style's own section on the Lessen page (under the tiles). Empty → only the tile. */
    i18nString("tagline", {
      title: "Ondertitel",
      group: "page",
      max: 80,
      description:
        "Eén zin onder de naam, bv. “Dezelfde reeks, elke keer een beetje dieper.”",
    }),
    i18nText("body", {
      title: "Over deze stijl",
      group: "page",
      max: 900,
      description: "Een paar korte alinea's (lege lijn = nieuwe alinea).",
    }),
    i18nLines("expect", { title: "Zo verloopt een les", group: "page" }),
    i18nLines("benefits", { title: "Wat het je geeft", group: "page" }),
    i18nString("level", {
      title: "Niveau",
      group: "page",
      max: 60,
      description: "bv. “Alle niveaus, beginners welkom”.",
    }),
    i18nString("bring", {
      title: "Meebrengen",
      group: "page",
      max: 80,
      description: "bv. “Je eigen mat, een handdoek”.",
    }),
    mediaField("photo2", {
      title: "Foto in de sectie",
      group: "page",
      description: "Leeg → de foto van de tegel.",
    }),
    defineField({
      name: "studios",
      title: "Waar?",
      group: "tile",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "studio" }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "orderRank",
      title: "Volgorde",
      type: "number",
      group: "tile",
      initialValue: 10,
      description: "Laag = eerst.",
    }),
  ],
  orderings: [
    {
      title: "Volgorde",
      name: "orderRank",
      by: [{ field: "orderRank", direction: "asc" }],
    },
  ],
  preview: { select: { title: "name", media: "photo.image" } },
});
