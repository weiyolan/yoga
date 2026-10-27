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
    defineField({ name: "hero", title: "Openingsbeeld", type: "hero", group: "content", description: "De grote foto met titel bovenaan de Lessen-pagina. De titel en ondertitel dienen ook als reserve voor de Google-titel en -beschrijving.", validation: (rule) => rule.required() }),
    i18nText("intro", { title: "Intro", group: "content", max: 300, description: "Korte tekst onder de kop van de stijlen (sectie #stijlen) op de Lessen-pagina, boven de tegels. Leeg = geen tekst; ook gebruikt als Google-beschrijving als SEO leeg is." }),
    i18nString("stylesTitle", { title: "Kop stijlen", group: "content", description: "Grote titel boven de tegels met de lesstijlen op de Lessen-pagina, bv. “Welke les past bij jou?”." }),
    i18nString("studiosTitle", { title: "Kop studio's", group: "content", description: "Grote titel boven het blok met de studio's (foto, adres, website) onderaan de Lessen-pagina." }),
    i18nString("scheduleTitle", { title: "Kop weekplanning", group: "schedule", description: "Grote titel boven de weekplanning, het eerste blok onder het openingsbeeld van de Lessen-pagina." }),
    i18nText("scheduleEmpty", { title: "Tekst als er (nog) geen weekplanning is", group: "schedule", description: "Op de Lessen-pagina in plaats van de weekplanning zolang die leeg is, met knoppen naar de websites van de studio's. Leeg = standaardtekst “De weekplanning volgt binnenkort…”." }),
    defineField({
      name: "schedule",
      title: "Weekplanning",
      type: "array",
      group: "schedule",
      description: "Rita's vaste lessen: verschijnen als weekrooster (kolom per dag) op de Lessen-pagina en per stijl bij “Wanneer?”. Stijlen en studio's komen uit hun eigen lijst.",
      of: [
        defineArrayMember({
          name: "classSlot",
          title: "Les",
          type: "object",
          fields: [
            defineField({ name: "day", title: "Dag", type: "string", description: "In welke dagkolom van de weekplanning de les staat; ook in de lesfiche en de aanvraag-e-mail aan Rita.", options: { list: WEEKDAYS }, validation: (rule) => rule.required() }),
            defineField({
              name: "startTime",
              title: "Start",
              type: "string",
              placeholder: "07:00",
              description: "Beginuur als uu:mm, bv. “07:00”. Getoond in het rooster en de lesfiche; lessen worden erop gesorteerd.",
              validation: (rule) => rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: "uu:mm" }),
            }),
            defineField({ name: "durationMinutes", title: "Duur (min.)", type: "number", initialValue: 60, description: "Lengte van de les in minuten. Getoond in het rooster en de lesfiche, die er ook het einduur mee berekent (bv. 18:30–19:30)." }),
            defineField({ name: "style", title: "Stijl", type: "reference", to: [{ type: "yogaClass" }], description: "Welke lesstijl: naam in het rooster, filterknoppen bovenaan en de lesfiche (met link naar de uitleg over die stijl).", validation: (rule) => rule.required() }),
            defineField({ name: "studio", title: "Studio", type: "reference", to: [{ type: "studio" }], description: "Waar de les doorgaat: naam in het rooster, naam en adres in de lesfiche en in de aanvraag-e-mail aan Rita.", validation: (rule) => rule.required() }),
            defineField({
              name: "level",
              title: "Niveau",
              type: "string",
              options: { list: LEVELS, layout: "radio", direction: "horizontal" },
              initialValue: "all",
              description: "Label in het rooster (niet bij “Alle niveaus”) en in de lesfiche. Leeg = alle niveaus.",
            }),
            defineField({ name: "bookingUrl", title: "Boekingslink", type: "url", description: "Link “Zelf boeken ↗” in de lesfiche van deze les. Leeg = website van de studio." }),
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
      description: "Compact blok onderaan de Lessen-pagina (#prive) voor wie liever één op één les wil. Leeg laten (geen kop en geen tekst) = niet getoond.",
      fields: [
        i18nString("title", { title: "Kop", description: "Grote titel van het privéles-blok onderaan de Lessen-pagina, bv. “Liever één op één?”. Leeg = “Liever één op één?”." }),
        i18nText("text", { title: "Tekst", max: 300, description: "Tekst onder de kop van het privéles-blok: wat en voor wie, in 1–3 zinnen." }),
        i18nString("practical", { title: "Praktisch", max: 80, description: "Kleine grijze lijn onder de tekst van het privéles-blok: duur · prijs · locatie, bv. “60 of 90 min · € 70 · Antwerpen”." }),
        mediaField("photo", { title: "Foto", description: "Foto naast de tekst van het privéles-blok onderaan de Lessen-pagina." }),
        i18nString("button", { title: "Knop", description: "Tekst op de knop in het privéles-blok; die gaat naar het contactformulier. Leeg = “Contacteer Rita”." }),
      ],
    }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo", group: "seo", description: "Niet zichtbaar op de pagina zelf: titel, beschrijving en beeld voor Google en bij delen op sociale media. Leeg = openingsbeeld en intro." }),
  ],
  preview: { prepare: () => ({ title: "Lessen" }) },
});
