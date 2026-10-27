import { CogIcon } from "@sanity/icons/Cog";
import { defineField, defineType } from "sanity";
import { i18nString } from "../shared/i18n";

/**
 * Algemeen: what holds for the whole site. Contact & social → Contact page; menu and footer texts →
 * Menu & footer (`navigation`); sign-up texts → Formulieren → Inschrijving pagina (`signupSettings`); mail
 * settings → Mails → Opties (`mailSettings`). Fixed `_id` "settings" (kept from when this was “Instellingen”).
 */
export const settings = defineType({
  name: "settings",
  title: "Algemeen",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({ name: "siteName", title: "Naam website", type: "string", initialValue: "Yoga, Zen & Tonic", description: "Als logo en bij © in de footer, in de titel van het browsertabblad, in Google en op deelafbeeldingen.", validation: (rule) => rule.required() }),
    i18nString("tagline", { title: "Slogan", max: 60, description: "Korte zin onder het logo in de footer, en in Google en de tabtitel van de homepagina als je geen eigen SEO invult." }),
    defineField({ name: "seo", title: "Standaard SEO", type: "seo", description: "Niet zichtbaar op de pagina's zelf: titel, omschrijving en deelfoto voor Google en delen, voor elke pagina waar je bij SEO niets invult." }),
  ],
  preview: { prepare: () => ({ title: "Algemeen" }) },
});
