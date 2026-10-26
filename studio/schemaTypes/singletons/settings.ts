import { CogIcon } from "@sanity/icons/Cog";
import { defineField, defineType } from "sanity";
import { i18nString } from "../shared/i18n";

/**
 * Algemeen: what holds for the whole site. Contact & social → Contact page; menu and footer texts →
 * Menu & footer (`navigation`); sign-up texts → Formulieren → Inschrijving (`signupSettings`); mail
 * settings → Mails → Opties (`mailSettings`). Fixed `_id` "settings" (kept from when this was “Instellingen”).
 */
export const settings = defineType({
  name: "settings",
  title: "Algemeen",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({ name: "siteName", title: "Naam website", type: "string", initialValue: "Yoga, Zen & Tonic", validation: (rule) => rule.required() }),
    i18nString("tagline", { title: "Slogan", max: 60, description: "Onder het logo in de footer en in zoekresultaten." }),
    defineField({ name: "seo", title: "Standaard SEO", type: "seo", description: "Fallback voor pagina's zonder eigen SEO." }),
  ],
  preview: { prepare: () => ({ title: "Algemeen" }) },
});
