import { CalendarIcon } from "@sanity/icons/Calendar";
import { defineField, defineType } from "sanity";
import { i18nString, i18nText } from "../shared/i18n";

export const retreatsPage = defineType({
  name: "retreatsPage",
  title: "Retreats-pagina",
  type: "document",
  icon: CalendarIcon,
  groups: [
    { name: "page", title: "Overzicht" },
    { name: "detail", title: "Retreatpagina's" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "hero", title: "Openingsbeeld", type: "hero", group: "page", description: "De grote foto met titel bovenaan de Retreats-pagina. Titel en ondertitel dienen ook als reserve voor Google en het deelvoorbeeld.", validation: (rule) => rule.required() }),
    i18nString("upcomingTitle", { title: "Kop komende retreats", group: "page", description: "Titel boven de kaartjes van de komende retreats op de Retreats-pagina. Leeg = enkel het kleine label “Komende retreats”." }),
    i18nString("pastTitle", { title: "Kop voorbije retreats", group: "page", description: "Titel boven de kaartjes van de voorbije retreats onderaan de Retreats-pagina. Leeg = enkel het kleine label “Voorbije retreats”." }),
    i18nText("noneUpcoming", { title: "Tekst als er geen komende retreats zijn", group: "page", description: "Verschijnt op de Retreats-pagina in plaats van de kaartjes als er geen komende retreat gepland is. Leeg = “Nieuwe retreats worden binnenkort aangekondigd.”." }),
    /* headings shared by every retreat page */
    i18nString("peopleTitle", { title: "Kop begeleiding", group: "detail", description: "Titel boven de begeleiders op elke retreatpagina. Leeg = “Wie begeleidt je?”." }),
    i18nString("programmeTitle", { title: "Kop programma", group: "detail", description: "Titel boven het programma op elke retreatpagina. Leeg = “Wat staat er op het menu?”." }),
    i18nString("practicalTitle", { title: "Kop praktisch", group: "detail", description: "Titel boven prijs en praktische info op elke retreatpagina. Leeg = “Prijs & wat is inbegrepen”." }),
    i18nString("recapTitle", { title: "Voorbije retreat: kop foto's", group: "detail", description: "Titel boven de foto's op de pagina van een voorbije retreat. Leeg = “Zo was het”." }),
    i18nString("pastCtaTitle", { title: "Voorbije retreat: slotvraag", group: "detail", description: "Slotvraag onderaan de pagina van een voorbije retreat, die naar de volgende retreat leidt. Leeg = “Zin om de volgende keer mee te gaan?”." }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo", group: "seo", description: "Niet zichtbaar op de pagina zelf: titel, omschrijving en deelfoto van de Retreats-pagina in Google en bij delen via WhatsApp of sociale media." }),
  ],
  preview: { prepare: () => ({ title: "Retreats" }) },
});
