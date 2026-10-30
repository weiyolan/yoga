import { SplitVerticalIcon } from "@sanity/icons/SplitVertical";
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
    { name: "menu", title: "Menu", icon: MenuIcon, default: true },
    { name: "footer", title: "Footer", icon: SplitVerticalIcon },
  ],
  fields: [
    i18nString("menuFounders", { group: "menu", title: "Over ons: naam bij de foto", description: "Naam bij de grote foto in het uitklapmenu Over ons (bovenaan de site). Leeg = “Rita & Philippe”." }),
    i18nString("menuFoundersSub", { group: "menu", title: "Over ons: ondertitel bij de foto", description: "Kleine tekst onder de naam bij de foto in het uitklapmenu Over ons. Leeg = “Yoga, natuur en freediving.”." }),
    i18nString("menuTeam", { group: "menu", title: "Over ons → Wie zijn wij: omschrijving", description: "Korte uitleg onder “Wie zijn wij” in het uitklapmenu Over ons. Leeg = “Maak kennis met Rita en Philippe.”." }),
    i18nString("menuDrive", { group: "menu", title: "Over ons → Wat ons drijft: omschrijving", description: "Korte uitleg onder “Wat ons drijft” in het uitklapmenu Over ons. Leeg = “Niets moet, echte mensen, buiten zijn.”." }),
    i18nString("menuCollaborators", { group: "menu", title: "Over ons → Samenwerkingen: omschrijving", description: "Korte uitleg onder “Samenwerkingen” in het uitklapmenu Over ons. Leeg = “Met wie we samenwerken.”." }),
    i18nString("menuUpcoming", { group: "menu", title: "Retreats → Komende: omschrijving", description: "Korte uitleg onder “Komende” in het uitklapmenu Retreats. Leeg = “Alle data en bestemmingen, chronologisch.”." }),
    i18nString("menuPast", { group: "menu", title: "Retreats → Voorbije: omschrijving", description: "Korte uitleg onder “Voorbije” in het uitklapmenu Retreats. Leeg = “Waar we al waren, in beeld.”." }),

    i18nString("newsletterTitle", { group: "footer", title: "Nieuwsbrief (footer): kop", description: "Titel boven het inschrijfveld voor de nieuwsbrief in de footer, onderaan elke pagina. Leeg = “Hou me op de hoogte”." }),
    i18nString("newsletterThanks", { group: "footer", title: "Nieuwsbrief: bedankt", description: "Bericht dat in de footer verschijnt nadat iemand zich voor de nieuwsbrief inschreef. Leeg = “Bedankt! We houden je op de hoogte.”." }),
  ],
  preview: { prepare: () => ({ title: "Menu & footer" }) },
});
