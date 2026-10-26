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
        "Kort en concreet, met waar het over gaat (bv. “Yoga & freediving retreat in Dahab”). De site zet er “ · Yoga, Zen & Tonic” achter. Leeg = de paginatitel.",
    }),
    i18nText("description", {
      title: "Beschrijving in Google",
      max: 160,
      description:
        "120–155 tekens: wat, waar, voor wie, en een reden om te klikken. Elke pagina een eigen tekst. Leeg = de introtekst van de pagina.",
    }),
    mediaField("shareImage", {
      title: "Deelafbeelding",
      description:
        "Voor WhatsApp, Facebook, … (liggend, wordt 1200 × 630). Leeg = openingsfoto.",
    }),
  ],
});
