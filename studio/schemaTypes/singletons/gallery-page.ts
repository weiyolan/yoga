import { ImagesIcon } from "@sanity/icons/Images";
import { defineField, defineType } from "sanity";
import { i18nString, i18nText } from "../shared/i18n";

/** The photos themselves come from the Fotobank (`mediaItem` with "Tonen in gallery" on). */
export const galleryPage = defineType({
  name: "galleryPage",
  title: "Gallery-pagina",
  type: "document",
  icon: ImagesIcon,
  fields: [
    i18nString("title", { title: "Kop", required: true, description: "Grote titel bovenaan de Gallery-pagina; ook de paginatitel in Google als je bij SEO niets invult." }),
    i18nText("intro", { title: "Intro (optioneel)", max: 200, description: "Korte tekst onder de kop van de Gallery-pagina, boven de foto's; ook reserve-omschrijving voor Google. Leeg = geen intro." }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo", description: "Niet zichtbaar op de pagina zelf: titel, omschrijving en deelfoto van de Gallery-pagina in Google en bij delen via WhatsApp of sociale media." }),
  ],
  preview: { prepare: () => ({ title: "Gallery", subtitle: "Foto's: Fotobank → Tonen in gallery" }) },
});
