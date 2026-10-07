import { CogIcon } from "@sanity/icons/Cog";
import { defineField, defineType } from "sanity";
import { i18nString, i18nText } from "../shared/i18n";

export const settings = defineType({
  name: "settings",
  title: "Instellingen",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "general", title: "Algemeen", default: true },
    { name: "contact", title: "Contact & social" },
    { name: "menu", title: "Menu" },
    { name: "forms", title: "Formulieren" },
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
    /* ---- menu (dropdowns in the header) ---- */
    i18nString("menuFounders", { title: "Over ons: naam bij de foto", group: "menu", description: "Leeg = “Rita & Philippe”." }),
    i18nString("menuFoundersSub", { title: "Over ons: ondertitel bij de foto", group: "menu", description: "Leeg = “Yoga, natuur en freediving.”." }),
    i18nString("menuTeam", { title: "Over ons → Het team: omschrijving", group: "menu", description: "Leeg = “Maak kennis met Rita en Philippe.”." }),
    i18nString("menuDrive", { title: "Over ons → Wat ons drijft: omschrijving", group: "menu", description: "Leeg = “Geen druk, echte mensen, buiten zijn.”." }),
    i18nString("menuGallery", { title: "Over ons → Gallery: omschrijving", group: "menu", description: "Leeg = “Momenten van onze retreats.”." }),
    i18nString("menuUpcoming", { title: "Retreats → Komende: omschrijving", group: "menu", description: "Leeg = “Alle data en bestemmingen, chronologisch.”." }),
    i18nString("menuPast", { title: "Retreats → Voorbije: omschrijving", group: "menu", description: "Leeg = “Waar we al waren, in beeld.”." }),
    i18nString("menuSearch", { title: "Retreats → Zoek: omschrijving", group: "menu", description: "Leeg = “Filter op bestemming of maand.”." }),

    /* ---- forms ---- */
    i18nString("newsletterTitle", { title: "Nieuwsbrief (footer): kop", group: "forms", description: "Leeg = “Hou me op de hoogte”." }),
    i18nString("newsletterThanks", { title: "Nieuwsbrief: bedankt", group: "forms", description: "Leeg = “Bedankt! We houden je op de hoogte.”." }),
    i18nString("contactThanks", { title: "Contactformulier: bedankt", group: "forms", description: "Leeg = “Bedankt! We antwoorden binnen 2 dagen.”." }),
    i18nText("signupConsent", { title: "Inschrijving: akkoordtekst", group: "forms", description: "Naast het vinkje. De link naar de privacyverklaring komt er automatisch achter. Leeg = standaardtekst." }),
    i18nText("signupThanks", { title: "Inschrijving: bedankt", group: "forms", description: "Getoond na het verzenden. Leeg = standaardtekst." }),
    i18nText("signupMail", {
      title: "Inschrijving: bevestigingsmail",
      group: "forms",
      description: "Mail naar de deelnemer. Gebruik {naam}, {retreat} en {datum}; die worden ingevuld. Leeg = standaardtekst.",
    }),
    defineField({ name: "seo", title: "Standaard SEO", type: "seo", group: "seo", description: "Fallback voor pagina's zonder eigen SEO." }),
  ],
  preview: { prepare: () => ({ title: "Instellingen" }) },
});
