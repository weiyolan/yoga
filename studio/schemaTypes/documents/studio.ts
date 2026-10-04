import { PinIcon } from "@sanity/icons/Pin";
import { defineField, defineType } from "sanity";
import { mediaField } from "../shared/media";

/** A studio where Rita teaches (Antwerp Yoga, Studio Pili, Magnolia Studios). */
export const studio = defineType({
  name: "studio",
  title: "Studio",
  type: "document",
  icon: PinIcon,
  fields: [
    defineField({ name: "name", title: "Naam", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "address", title: "Adres", type: "string" }),
    defineField({ name: "city", title: "Gemeente", type: "string", initialValue: "Antwerpen" }),
    defineField({ name: "website", title: "Website", type: "url", validation: (rule) => rule.uri({ scheme: ["https", "http"] }) }),
    mediaField("photo", { title: "Foto" }),
  ],
  preview: {
    select: { title: "name", subtitle: "city", media: "photo.image" },
  },
});
