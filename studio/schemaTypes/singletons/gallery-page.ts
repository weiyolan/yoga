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
    i18nString("title", { title: "Kop", required: true }),
    i18nText("intro", { title: "Intro (optioneel)", max: 200 }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Gallery", subtitle: "Foto's: Fotobank → Tonen in gallery" }) },
});
