import { ImageIcon } from "@sanity/icons/Image";
import { defineField, defineType } from "sanity";
import { i18nString, i18nText, pick } from "../shared/i18n";

export const MEDIA_CATEGORIES = [
  { title: "Retreats", value: "retreats" },
  { title: "Lessen", value: "lessen" },
  { title: "Natuur", value: "natuur" },
  { title: "Team", value: "team" },
];

/**
 * Fotobank: every picture on the site lives here once. Hotspot, alt text and SEO
 * are filled in once; pages reference the item, so a fix applies everywhere.
 */
export const mediaItem = defineType({
  name: "mediaItem",
  title: "Foto",
  type: "document",
  icon: ImageIcon,
  groups: [
    { name: "image", title: "Foto", default: true },
    { name: "seo", title: "SEO & toegankelijkheid" },
    { name: "gallery", title: "Gallery" },
  ],
  fields: [
    defineField({
      name: "image",
      title: "Foto",
      type: "image",
      group: "image",
      options: { hotspot: true, metadata: ["lqip", "palette", "exif"] },
      description: "Zet het focuspunt (hotspot) op het belangrijkste deel: elke uitsnede op de site houdt dat punt in beeld.",
      validation: (rule) => rule.required(),
    }),
    i18nString("title", { title: "Titel / bijschrift", group: ["image", "gallery"], max: 80, description: "Wat je ziet, bv. “Woestijn bij zonsopgang”." }),
    i18nString("place", { title: "Plaats", group: ["image", "gallery"], description: "bv. “Dahab” of “Eifel”." }),
    defineField({ name: "takenAt", title: "Datum", type: "date", group: ["image", "gallery"], options: { dateFormat: "D MMMM YYYY" } }),
    i18nString("alt", {
      title: "Alt-tekst",
      group: "seo",
      required: true,
      max: 125,
      description: "Beschrijf de foto voor wie hem niet ziet (schermlezers, Google). Geen “foto van …”.",
    }),
    i18nText("description", { title: "Beschrijving (optioneel)", group: "seo", max: 300, description: "Langere context voor zoekmachines." }),
    defineField({ name: "credit", title: "Fotograaf", type: "string", group: "seo" }),
    defineField({
      name: "categories",
      title: "Categorieën",
      type: "array",
      group: "gallery",
      of: [{ type: "string" }],
      options: { list: MEDIA_CATEGORIES, layout: "grid" },
      validation: (rule) => rule.unique(),
    }),
    defineField({ name: "retreat", title: "Retreat", type: "reference", to: [{ type: "retreat" }], group: "gallery", description: "Optioneel: bij welke retreat hoort deze foto?" }),
    defineField({ name: "showInGallery", title: "Tonen in gallery", type: "boolean", group: "gallery", initialValue: true }),
    defineField({ name: "highlight", title: "Uitgelicht", type: "boolean", group: "gallery", initialValue: false, description: "Krijgt een grotere plek in de mozaïek." }),
  ],
  orderings: [
    { title: "Nieuwste eerst", name: "takenAtDesc", by: [{ field: "takenAt", direction: "desc" }] },
    { title: "Laatst toegevoegd", name: "createdDesc", by: [{ field: "_createdAt", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", alt: "alt", place: "place", takenAt: "takenAt", media: "image", file: "image.asset.originalFilename" },
    prepare: ({ title, alt, place, takenAt, media, file }) => ({
      title: pick(title) ?? pick(alt) ?? file ?? "Foto",
      subtitle: [pick(alt) ? null : "⚠ geen alt-tekst", pick(place), takenAt].filter(Boolean).join(" · "),
      media,
    }),
  },
});
