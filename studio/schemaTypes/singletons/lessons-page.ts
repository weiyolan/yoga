import { ActivityIcon } from "@sanity/icons/Activity";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nString, i18nText } from "../shared/i18n";
import { mediaField } from "../shared/media";

export const WEEKDAYS = [
  { title: "Maandag", value: "mon" },
  { title: "Dinsdag", value: "tue" },
  { title: "Woensdag", value: "wed" },
  { title: "Donderdag", value: "thu" },
  { title: "Vrijdag", value: "fri" },
  { title: "Zaterdag", value: "sat" },
  { title: "Zondag", value: "sun" },
];

export const LEVELS = [
  { title: "Alle niveaus", value: "all" },
  { title: "Beginner", value: "beginner" },
  { title: "Gemiddeld", value: "intermediate" },
  { title: "Gevorderd", value: "advanced" },
];

export const lessonsPage = defineType({
  name: "lessonsPage",
  title: "Lessen-pagina",
  type: "document",
  icon: ActivityIcon,
  groups: [
    { name: "content", title: "Inhoud" },
    { name: "schedule", title: "Weekplanning" },
    { name: "private", title: "Privéles" },
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
            defineField({
              name: "level",
              title: "Niveau",
              type: "string",
              options: { list: LEVELS, layout: "radio", direction: "horizontal" },
              initialValue: "all",
              description: "Leeg = alle niveaus.",
            }),
            defineField({ name: "bookingUrl", title: "Boekingslink", type: "url", description: "Leeg = website van de studio." }),
          ],
          preview: {
            select: { day: "day", time: "startTime", style: "style.name", studio: "studio.name", level: "level" },
            prepare: ({ day, time, style, studio, level }) => ({
              title: `${WEEKDAYS.find((d) => d.value === day)?.title ?? "?"} ${time ?? ""} · ${style ?? "?"}`,
              subtitle: [studio, LEVELS.find((l) => l.value === (level ?? "all"))?.title].filter(Boolean).join(" · "),
            }),
          },
        }),
      ],
    }),
    /* ---- privéles: one compact section at the bottom (#prive), replaces the old Coaching page ---- */
    defineField({
      name: "private",
      title: "Privéles",
      type: "object",
      group: "private",
      description: "Compact blok onderaan de Lessen-pagina. Leeg laten = niet getoond.",
      fields: [
        i18nString("title", { title: "Kop", description: "bv. “Liever één op één?”." }),
        i18nText("text", { title: "Tekst", max: 300, description: "Wat en voor wie, in 1–3 zinnen." }),
        i18nString("practical", { title: "Praktisch", max: 80, description: "Eén lijn: duur · prijs · locatie, bv. “60 of 90 min · € 70 · Antwerpen”." }),
        mediaField("photo", { title: "Foto" }),
        i18nString("button", { title: "Knop", description: "Leeg = “Contacteer Rita”. Gaat naar het contactformulier." }),
      ],
    }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo", group: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Lessen" }) },
});
