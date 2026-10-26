import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { defineField, defineType } from "sanity";
import { i18nLines, i18nString, i18nText } from "../shared/i18n";
import { mediaField } from "../shared/media";

export const contactPage = defineType({
  name: "contactPage",
  title: "Contact-pagina",
  type: "document",
  icon: EnvelopeIcon,
  groups: [
    { name: "page", title: "Pagina" },
    { name: "contact", title: "Contact & social" },
  ],
  fields: [
    mediaField("photo", { title: "Foto", required: true, group: "page" }),
    i18nString("title", { group: "page", title: "Kop", required: true }),
    i18nText("intro", { group: "page", title: "Intro", max: 250 }),
    i18nLines("subjects", { group: "page", title: "Onderwerpen", description: "Keuzes bij “Waarover?”." }),
    i18nString("notifyLabel", { group: "page", title: "Tekst bij vinkje", description: "bv. “Hou me op de hoogte van de volgende retreat”." }),
    i18nString("contactThanks", { group: "page", title: "Contactformulier: bedankt", description: "Leeg = “Bedankt! We antwoorden binnen 2 dagen.”." }),
    /* ---- contact & social: also in the footer ---- */
    defineField({ name: "email", title: "E-mail", type: "string", group: "contact", validation: (rule) => rule.email() }),
    defineField({ name: "phone", title: "GSM", type: "string", group: "contact", description: "Internationaal formaat, bv. +32 477 74 42 40." }),
    defineField({ name: "instagram", title: "Instagram", type: "url", group: "contact" }),
    defineField({ name: "facebook", title: "Facebook", type: "url", group: "contact" }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo", group: "page" }),
  ],
  preview: { prepare: () => ({ title: "Contact" }) },
});
