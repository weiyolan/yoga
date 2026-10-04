import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { defineField, defineType } from "sanity";
import { i18nLines, i18nString, i18nText } from "../shared/i18n";
import { mediaField } from "../shared/media";

export const contactPage = defineType({
  name: "contactPage",
  title: "Contact-pagina",
  type: "document",
  icon: EnvelopeIcon,
  fields: [
    mediaField("photo", { title: "Foto", required: true }),
    i18nString("title", { title: "Kop", required: true }),
    i18nText("intro", { title: "Intro", max: 250 }),
    i18nLines("subjects", { title: "Onderwerpen", description: "Keuzes bij “Waarover?”." }),
    i18nString("notifyLabel", { title: "Tekst bij vinkje", description: "bv. “Hou me op de hoogte van de volgende retreat”." }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Contact" }) },
});
