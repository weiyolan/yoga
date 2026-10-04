import { CalendarIcon } from "@sanity/icons/Calendar";
import { defineField, defineType } from "sanity";
import { i18nString } from "../shared/i18n";

export const retreatsPage = defineType({
  name: "retreatsPage",
  title: "Retreats-pagina",
  type: "document",
  icon: CalendarIcon,
  fields: [
    defineField({ name: "hero", title: "Openingsbeeld", type: "hero", validation: (rule) => rule.required() }),
    i18nString("upcomingTitle", { title: "Kop komende retreats" }),
    i18nString("pastTitle", { title: "Kop voorbije retreats" }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Retreats" }) },
});
