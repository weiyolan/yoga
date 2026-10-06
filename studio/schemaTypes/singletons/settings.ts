import { CogIcon } from "@sanity/icons/Cog";
import { defineField, defineType } from "sanity";
import { i18nString } from "../shared/i18n";

export const settings = defineType({
  name: "settings",
  title: "Instellingen",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "general", title: "Algemeen", default: true },
    { name: "contact", title: "Contact & social" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "siteName", title: "Naam website", type: "string", group: "general", initialValue: "Yoga, Zen & Tonic", validation: (rule) => rule.required() }),
    i18nString("tagline", { title: "Slogan", group: "general", max: 60 }),
    defineField({
      name: "defaultSignupUrl",
      title: "Standaard inschrijflink",
      type: "url",
      group: "general",
      description: "Optioneel: externe inschrijflink (bv. Google Form) voor elke retreat zonder eigen link. Leeg = het inschrijfformulier op de site (inschrijvingen komen in Inschrijvingen).",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),
    defineField({ name: "email", title: "E-mail", type: "string", group: "contact", validation: (rule) => rule.email() }),
    defineField({ name: "phone", title: "GSM", type: "string", group: "contact", description: "Internationaal formaat, bv. +32 477 74 42 40." }),
    defineField({ name: "instagram", title: "Instagram", type: "url", group: "contact" }),
    defineField({ name: "facebook", title: "Facebook", type: "url", group: "contact" }),
    defineField({ name: "seo", title: "Standaard SEO", type: "seo", group: "seo", description: "Fallback voor pagina's zonder eigen SEO." }),
  ],
  preview: { prepare: () => ({ title: "Instellingen" }) },
});
