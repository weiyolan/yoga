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
      description:
        "Naam van de stijl, bv. “Vinyasa”. Op de tegels (Home en Lessen), als titel van de eigen sectie, in het rooster, het menu Lessen en in nieuwsbrieven.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      description:
        "Stukje webadres voor deze stijl: de sectie op de Lessen-pagina heet #slug en de tegels en het menu linken ernaartoe. Klik “Generate”.",
      group: "tile",
      validation: (rule) => rule.required(),
    }),
    mediaField("photo", {
      title: "Foto",
      group: "tile",
      required: true,
      description:
        "Foto van de tegel (Home en Lessen) en van de kaart in een nieuwsbrief. Ook in de eigen sectie als “Foto in de sectie” leeg is.",
    }),
    i18nText("what", {
      title: "Wat is het?",
      group: "tile",
      required: true,
      max: 160,
      description:
        "Korte uitleg bij “Wat is het?” op de tegel (Home en Lessen), in het menu Lessen en in de lesfiche van het rooster. Ook de sectietekst als “Over deze stijl” leeg is.",
    }),
    i18nText("forWhom", {
      title: "Voor wie?",
      group: "tile",
      required: true,
      max: 160,
      description:
        "Voor wie de les is, bv. “Beginners en wie rust zoekt”. Op de tegel (Home en Lessen) en bij “Voor wie?” in de eigen sectie op de Lessen-pagina.",
    }),
    /* The style's own section on the Lessen page (under the tiles). Empty → only the tile. */
    i18nString("tagline", {
      title: "Ondertitel",
      group: "page",
      max: 80,
      description:
        "Eén zin onder de naam in de eigen sectie op de Lessen-pagina en op de kaart in een nieuwsbrief, bv. “Dezelfde reeks, elke keer een beetje dieper.”",
    }),
    i18nText("body", {
      title: "Over deze stijl",
      group: "page",
      max: 900,
      description: "Hoofdtekst van de eigen sectie op de Lessen-pagina: een paar korte alinea's (lege lijn = nieuwe alinea). Leeg = de tekst van “Wat is het?”.",
    }),
    i18nLines("expect", {
      title: "Zo verloopt een les",
      group: "page",
      description: "Lijstje met vinkjes onder “Zo verloopt een les” in de eigen sectie op de Lessen-pagina. Leeg = niet getoond.",
    }),
    i18nLines("benefits", {
      title: "Wat het je geeft",
      group: "page",
      description: "Lijstje met vinkjes onder “Wat het je geeft” in de eigen sectie op de Lessen-pagina. Leeg = niet getoond.",
    }),
    i18nString("level", {
      title: "Niveau",
      group: "page",
      max: 60,
      description: "Getoond bij “Niveau” in het lijstje praktische info van de eigen sectie op de Lessen-pagina, bv. “Alle niveaus, beginners welkom”. Leeg = niet getoond.",
    }),
    i18nString("bring", {
      title: "Meebrengen",
      group: "page",
      max: 80,
      description: "Getoond bij “Meebrengen” in het lijstje praktische info van de eigen sectie op de Lessen-pagina, bv. “Je eigen mat, een handdoek”. Leeg = niet getoond.",
    }),
    mediaField("photo2", {
      title: "Foto in de sectie",
      group: "page",
      description: "Grote foto naast de tekst in de eigen sectie op de Lessen-pagina. Leeg → de foto van de tegel.",
    }),
    defineField({
      name: "studios",
      title: "Waar?",
      group: "tile",
      type: "array",
      description:
        "Studio's waar Rita deze stijl geeft. Getoond bij “Waar?” op de tegel (Home en Lessen) en in de eigen sectie op de Lessen-pagina.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "studio" }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "orderRank",
      title: "Volgorde",
      type: "number",
      group: "tile",
      initialValue: 10,
      description: "Bepaalt de volgorde van de stijlen op de tegels, de secties van de Lessen-pagina en in het menu Lessen. Laag = eerst.",
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
