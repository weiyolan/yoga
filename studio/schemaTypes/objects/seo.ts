import { SearchIcon } from "@sanity/icons/Search";
import { defineType } from "sanity";
import { i18nString, i18nText } from "../shared/i18n";
import { mediaField } from "../shared/media";

/** Page-specific search & share metadata. Empty fields fall back to the page title / settings. */
export const seo = defineType({
  name: "seo",
  title: "SEO & delen",
  type: "object",
  icon: SearchIcon,
  options: { collapsible: true, collapsed: true },
  fields: [
    i18nString("title", { title: "Titel in Google", max: 60 }),
    i18nText("description", { title: "Beschrijving in Google", max: 160 }),
    mediaField("shareImage", { title: "Deelafbeelding", description: "Voor WhatsApp, Facebook, … Leeg = openingsfoto." }),
  ],
});
