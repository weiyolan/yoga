import { ImageIcon } from "@sanity/icons/Image";
import { defineField, defineType } from "sanity";
import { i18nString, pick } from "../shared/i18n";

export const MEDIA_CATEGORIES = [
  { title: "Retreats", value: "retreats" },
  { title: "Lessen", value: "lessen" },
  { title: "Natuur", value: "natuur" },
  { title: "Team", value: "team" },
];

/**
 * Fotobank: every picture on the site lives here once. Hotspot and alt text are filled in
 * once; pages reference the item, so a fix applies everywhere. One short form: the gallery
 * shows no title or place, so a photo only needs its image, alt text (SEO) and categories.
 */
export const mediaItem = defineType({
  name: "mediaItem",
  title: "Foto",
  type: "document",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "image",
      title: "Foto",
      type: "image",
      options: { hotspot: true, metadata: ["lqip", "palette", "exif"] },
      description: "Zet het focuspunt (hotspot) op het belangrijkste deel: elke uitsnede op de site houdt dat punt in beeld.",
      validation: (rule) => rule.required(),
    }),
    i18nString("alt", {
      title: "Alt-tekst",
      required: true,
      max: 125,
      description: "Beschrijf de foto voor wie hem niet ziet (schermlezers, Google). Geen “foto van …”.",
    }),
    defineField({
      name: "categories",
      title: "Categorieën",
      type: "array",
      of: [{ type: "string" }],
      options: { list: MEDIA_CATEGORIES, layout: "grid" },
      validation: (rule) => rule.unique(),
    }),
    defineField({ name: "showInGallery", title: "Tonen in gallery", type: "boolean", initialValue: true }),
    defineField({ name: "highlight", title: "Uitgelicht", type: "boolean", initialValue: false, description: "Krijgt een grotere plek in de mozaïek en op Home (Instagram)." }),
  ],
  orderings: [{ title: "Laatst toegevoegd", name: "createdDesc", by: [{ field: "_createdAt", direction: "desc" }] }],
  preview: {
    select: { alt: "alt", categories: "categories", media: "image", file: "image.asset.originalFilename" },
    prepare: ({ alt, categories, media, file }) => ({
      title: pick(alt) ?? "⚠ geen alt-tekst",
      subtitle: [pick(alt) ? null : file, (categories as string[] | undefined)?.map((c) => MEDIA_CATEGORIES.find((x) => x.value === c)?.title ?? c).join(", ")].filter(Boolean).join(" · "),
      media,
    }),
  },
});
