import { ActivityIcon } from "@sanity/icons/Activity";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nString, i18nText } from "../shared/i18n";

export const WEEKDAYS = [
  { title: "Maandag", value: "mon" },
  { title: "Dinsdag", value: "tue" },
  { title: "Woensdag", value: "wed" },
  { title: "Donderdag", value: "thu" },
  { title: "Vrijdag", value: "fri" },
  { title: "Zaterdag", value: "sat" },
  { title: "Zondag", value: "sun" },
];

export const lessonsPage = defineType({
  name: "lessonsPage",
  title: "Lessen-pagina",
  type: "document",
  icon: ActivityIcon,
  groups: [
    { name: "content", title: "Inhoud", default: true },
    { name: "schedule", title: "Weekplanning" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({ name: "hero", title: "Openingsbeeld", type: "hero", group: "content", validation: (rule) => rule.required() }),
    i18nText("intro", { title: "Intro", group: "content", max: 300 }),
    i18nString("stylesTitle", { title: "Kop stijlen", group: "content" }),
    i18nString("studiosTitle", { title: "Kop studio's", group: "content" }),
    i18nString("scheduleTitle", { title: "Kop weekplanning", group: "schedule" }),
    i18nText("scheduleEmpty", { title: "Tekst als er (nog) geen weekplanning is", group: "schedule", description: "Getoond met de links naar de studio's zolang de planning hieronder leeg is." }),
    defineField({
      name: "schedule",
      title: "Weekplanning",
      type: "array",
      group: "schedule",
      description: "Rita's vaste lessen. Stijlen en studio's komen uit hun eigen lijst.",
      of: [
        defineArrayMember({
          name: "classSlot",
          title: "Les",
          type: "object",
          fields: [
            defineField({ name: "day", title: "Dag", type: "string", options: { list: WEEKDAYS }, validation: (rule) => rule.required() }),
            defineField({
              name: "startTime",
              title: "Start",
              type: "string",
              placeholder: "07:00",
              validation: (rule) => rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: "uu:mm" }),
            }),
            defineField({ name: "durationMinutes", title: "Duur (min.)", type: "number", initialValue: 60 }),
            defineField({ name: "style", title: "Stijl", type: "reference", to: [{ type: "yogaClass" }], validation: (rule) => rule.required() }),
            defineField({ name: "studio", title: "Studio", type: "reference", to: [{ type: "studio" }], validation: (rule) => rule.required() }),
            defineField({ name: "bookingUrl", title: "Boekingslink", type: "url", description: "Leeg = website van de studio." }),
          ],
          preview: {
            select: { day: "day", time: "startTime", style: "style.name", studio: "studio.name" },
            prepare: ({ day, time, style, studio }) => ({
              title: `${WEEKDAYS.find((d) => d.value === day)?.title ?? "?"} ${time ?? ""} · ${style ?? "?"}`,
              subtitle: studio,
            }),
          },
        }),
      ],
    }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo", group: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Lessen" }) },
});
