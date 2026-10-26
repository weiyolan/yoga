import { MenuIcon } from "@sanity/icons/Menu";
import { defineType } from "sanity";
import { i18nString } from "../shared/i18n";

/** Menu & footer: the short texts in the header dropdowns and the footer's newsletter block. Fixed `_id` "navigation". */
export const navigation = defineType({
  name: "navigation",
  title: "Menu & footer",
  type: "document",
  icon: MenuIcon,
  groups: [
    { name: "menu", title: "Menu" },
    { name: "footer", title: "Footer" },
  ],
  fields: [
    i18nString("menuFounders", { group: "menu", title: "Over ons: naam bij de foto", description: "Leeg = “Rita & Philippe”." }),
    i18nString("menuFoundersSub", { group: "menu", title: "Over ons: ondertitel bij de foto", description: "Leeg = “Yoga, natuur en freediving.”." }),
    i18nString("menuTeam", { group: "menu", title: "Over ons → Wie zijn wij: omschrijving", description: "Leeg = “Maak kennis met Rita en Philippe.”." }),
    i18nString("menuDrive", { group: "menu", title: "Over ons → Wat ons drijft: omschrijving", description: "Leeg = “Niets moet, echte mensen, buiten zijn.”." }),
    i18nString("menuCollaborators", { group: "menu", title: "Over ons → Samenwerkingen: omschrijving", description: "Leeg = “Met wie we samenwerken.”." }),
    i18nString("menuUpcoming", { group: "menu", title: "Retreats → Komende: omschrijving", description: "Leeg = “Alle data en bestemmingen, chronologisch.”." }),
    i18nString("menuPast", { group: "menu", title: "Retreats → Voorbije: omschrijving", description: "Leeg = “Waar we al waren, in beeld.”." }),

    i18nString("newsletterTitle", { group: "footer", title: "Nieuwsbrief (footer): kop", description: "Leeg = “Hou me op de hoogte”." }),
    i18nString("newsletterThanks", { group: "footer", title: "Nieuwsbrief: bedankt", description: "Leeg = “Bedankt! We houden je op de hoogte.”." }),
  ],
  preview: { prepare: () => ({ title: "Menu & footer" }) },
});
