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
    defineField({ name: "name", title: "Naam", type: "string", description: "Naam van de studio, bv. “Antwerp Yoga”. Op de Lessen-pagina (studio's, rooster, lesfiche), in het menu Lessen, bij de lessen op Home en in de aanvraag-e-mail.", validation: (rule) => rule.required() }),
    defineField({ name: "address", title: "Adres", type: "string", description: "Straat en nummer, bv. “Kloosterstraat 12”. Getoond onder de naam in het blok studio's op de Lessen-pagina en in de lesfiche van de weekplanning." }),
    defineField({ name: "city", title: "Gemeente", type: "string", initialValue: "Antwerpen", description: "Getoond na het adres in het blok studio's op de Lessen-pagina en in de lesfiche van de weekplanning." }),
    defineField({ name: "website", title: "Website", type: "url", description: "Link “Website” bij de studio op de Lessen-pagina, op de studionaam bij de lessen op Home, en standaard boekingslink in de lesfiche.", validation: (rule) => rule.uri({ scheme: ["https", "http"] }) }),
    mediaField("photo", { title: "Foto", description: "Foto boven de naam van de studio in het blok studio's onderaan de Lessen-pagina." }),
  ],
  preview: {
    select: { title: "name", subtitle: "city", media: "photo.image" },
  },
});
