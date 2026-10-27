import { SearchIcon } from "@sanity/icons/Search";
import { defineType } from "sanity";
import { SeoInput } from "../../components/SeoPreview";
import { i18nString, i18nText } from "../shared/i18n";
import { mediaField } from "../shared/media";

/** Page-specific search & share metadata, with a Google preview. Empty fields fall back to the page title / intro / settings. */
export const seo = defineType({
  name: "seo",
  title: "SEO & delen",
  type: "object",
  icon: SearchIcon,
  options: { collapsible: true, collapsed: true },
  components: { input: SeoInput },
  fields: [
    i18nString("title", {
      title: "Titel in Google",
      max: 42,
      description:
        "De titel in Google en in het browsertabblad (en op de deelafbeelding). Kort en concreet, bv. “Yoga & freediving retreat in Dahab”; de site zet er “ · Yoga, Zen & Tonic” achter. Leeg = de paginatitel.",
    }),
    i18nText("description", {
      title: "Beschrijving in Google",
      max: 160,
      description:
        "Het tekstje onder de titel in Google en bij gedeelde links. 120–155 tekens: wat, waar, voor wie, en een reden om te klikken. Elke pagina een eigen tekst. Leeg = de introtekst van de pagina.",
    }),
    mediaField("shareImage", {
      title: "Deelafbeelding",
      description:
        "De foto die verschijnt als iemand de pagina deelt via WhatsApp, Facebook, … (liggend, wordt 1200 × 630 met de titel erop). Niet zichtbaar op de pagina zelf. Leeg = de openingsfoto.",
    }),
  ],
});
