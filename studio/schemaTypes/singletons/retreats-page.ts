import { CalendarIcon } from "@sanity/icons/Calendar";
import { defineField, defineType } from "sanity";
import { i18nString, i18nText } from "../shared/i18n";

export const retreatsPage = defineType({
  name: "retreatsPage",
  title: "Retreats-pagina",
  type: "document",
  icon: CalendarIcon,
  groups: [
    { name: "page", title: "Overzicht", default: true },
    { name: "detail", title: "Retreatpagina's" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "hero", title: "Openingsbeeld", type: "hero", group: "page", validation: (rule) => rule.required() }),
    i18nString("upcomingTitle", { title: "Kop komende retreats", group: "page" }),
    i18nString("pastTitle", { title: "Kop voorbije retreats", group: "page" }),
    i18nText("noneUpcoming", { title: "Tekst als er geen komende retreats zijn", group: "page", description: "Leeg = “Nieuwe retreats worden binnenkort aangekondigd.”." }),
    /* headings shared by every retreat page */
    i18nString("peopleTitle", { title: "Kop begeleiding", group: "detail", description: "Leeg = “Wie begeleidt je?”." }),
    i18nString("programmeTitle", { title: "Kop programma", group: "detail", description: "Leeg = “Wat staat er op het menu?”." }),
    i18nString("practicalTitle", { title: "Kop praktisch", group: "detail", description: "Leeg = “Prijs & wat is inbegrepen”." }),
    i18nString("recapTitle", { title: "Voorbije retreat: kop foto's", group: "detail", description: "Leeg = “Zo was het”." }),
    i18nString("pastCtaTitle", { title: "Voorbije retreat: slotvraag", group: "detail", description: "Leeg = “Zin om de volgende keer mee te gaan?”." }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo", group: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Retreats" }) },
});
