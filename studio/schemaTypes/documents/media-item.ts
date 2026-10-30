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
 * shows no title or place, so a photo only needs its image, alt text (SEO) and categories (+ optionally who took it).
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
      description: "De foto zelf, overal waar je hem kiest (pagina’s, retreats, gallery). Zet het focuspunt (hotspot) op het belangrijkste deel: elke uitsnede op de site houdt dat punt in beeld.",
      validation: (rule) => rule.required(),
    }),
    i18nString("alt", {
      title: "Alt-tekst",
      required: true,
      max: 125,
      description: "Niet zichtbaar, maar voorgelezen door schermlezers en gelezen door Google (ook in de vergrote weergave). Beschrijf kort wat er te zien is, zonder “foto van …”.",
    }),
    defineField({
      name: "categories",
      title: "Categorieën",
      type: "array",
      of: [{ type: "string" }],
      options: { list: MEDIA_CATEGORIES, layout: "grid" },
      description: "De filterknoppen op de Gallery-pagina (bv. “Natuur”): de foto verschijnt onder elke categorie die je aanvinkt. Helpt je ook zoeken in de Fotobank.",
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "photographer",
      title: "Fotograaf",
      type: "reference",
      to: [{ type: "photographer" }],
      description: "Optioneel: wie de foto nam. De naam (met link naar hun website) staat klein onder de foto op volledig scherm en gaat naar Google. Nog niet in de lijst? Fotobank → Fotografen, of hier “Nieuwe aanmaken”.",
    }),
    defineField({ name: "showInGallery", title: "Tonen in gallery", type: "boolean", initialValue: true, description: "Aan = de foto staat in de mozaïek op de Gallery-pagina. Uit = enkel te gebruiken op andere pagina’s (bv. een portret of logo)." }),
    defineField({ name: "highlight", title: "Uitgelicht", type: "boolean", initialValue: false, description: "Krijgt een grote tegel in de mozaïek op de Gallery-pagina en komt in het Instagram-blok op Home (de 6 nieuwste, enkel als Home → Instagram leeg is). Ook reservefoto voor gedeelde links zonder eigen foto." }),
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
