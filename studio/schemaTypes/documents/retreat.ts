import { CalendarIcon } from "@sanity/icons/Calendar";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nLines, i18nString, i18nText, pick } from "../shared/i18n";
import { mediaArrayField, mediaField } from "../shared/media";

/**
 * A retreat. Sections follow the detail page (and the Dahab Facebook event):
 * notendop · de plek · de mensen · het programma · praktisch · klaar om te duiken?
 * Upcoming vs. past is derived from `endDate`, never stored.
 * Past retreats show hero, notendop, facts and recap photos only (see the group description).
 */
export const retreat = defineType({
  name: "retreat",
  title: "Retreat",
  type: "document",
  icon: CalendarIcon,
  groups: [
    { name: "basics", title: "Basis", default: true },
    { name: "nutshell", title: "Notendop" },
    { name: "place", title: "De plek" },
    { name: "people", title: "De mensen" },
    { name: "programme", title: "Programma" },
    { name: "practical", title: "Praktisch" },
    { name: "closing", title: "Afsluiter" },
    { name: "recap", title: "Achteraf" },
    { name: "seo", title: "SEO" },
  ],
  fieldsets: [{ name: "dates", title: "Wanneer", options: { columns: 2 } }],
  fields: [
    /* ---- basis ---- */
    i18nString("title", { title: "Titel", group: "basics", required: true, max: 60, description: "bv. “Dahab: Yoga & Freediving”." }),
    defineField({
      name: "slug",
      title: "Slug (webadres)",
      type: "slug",
      group: "basics",
      options: { source: (doc) => `${pick(doc.title as never) ?? ""} ${String(doc.startDate ?? "").slice(0, 4)}`, maxLength: 60 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "startDate", title: "Van", type: "date", group: "basics", fieldset: "dates", validation: (rule) => rule.required() }),
    defineField({
      name: "endDate",
      title: "Tot en met",
      type: "date",
      group: "basics",
      fieldset: "dates",
      validation: (rule) =>
        rule.required().custom((end, ctx) => {
          const start = ctx.document?.startDate as string | undefined;
          return !start || !end || end >= start ? true : "Einddatum ligt vóór de startdatum";
        }),
    }),
    i18nString("place", { title: "Plaats", group: "basics", required: true, description: "bv. “Dahab”." }),
    i18nString("country", { title: "Land", group: "basics", required: true }),
    defineField({ name: "venue", title: "Verblijf", type: "string", group: "basics", description: "bv. “Nour Boutique Hotel”." }),
    defineField({ name: "capacity", title: "Max. deelnemers", type: "number", group: "basics", validation: (rule) => rule.integer().min(1) }),
    defineField({ name: "priceFrom", title: "Prijs vanaf (€)", type: "number", group: "basics", validation: (rule) => rule.min(0) }),
    defineField({
      name: "signupUrl",
      title: "Inschrijflink",
      type: "url",
      group: "basics",
      description: "Optioneel: externe inschrijflink. Leeg = standaard inschrijflink uit Instellingen, en anders het formulier op de site.",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),
    mediaField("cardPhoto", { title: "Foto op de kaart", group: "basics", required: true }),
    defineField({ name: "hero", title: "Openingsbeeld", type: "hero", group: "basics", validation: (rule) => rule.required() }),
    mediaArrayField("moodPhotos", { title: "Sfeerfoto's", group: "basics", max: 4, description: "3–4 foto's direct onder de opening." }),

    /* ---- notendop ---- */
    i18nString("nutshellTitle", { title: "Kop", group: "nutshell", max: 90 }),
    i18nText("nutshellText", { title: "Intro", group: "nutshell", required: true, max: 400 }),
    i18nLines("highlights", { title: "Hoogtepunten", group: "nutshell", description: "Max. 5." }),

    /* ---- de plek ---- */
    i18nString("placeTitle", { title: "Kop", group: "place" }),
    i18nText("placeText", { title: "Tekst", group: "place", max: 500 }),
    mediaArrayField("placePhotos", { title: "Foto's", group: "place", max: 2 }),

    /* ---- de mensen ---- */
    defineField({
      name: "hosts",
      title: "Begeleiding",
      type: "array",
      group: "people",
      of: [defineArrayMember({ type: "reference", to: [{ type: "person" }] })],
      validation: (rule) => rule.unique(),
    }),

    /* ---- programma ---- */
    defineField({
      name: "programme",
      title: "Programma",
      type: "array",
      group: "programme",
      description: "Hoogtepunten, geen dagprogramma per uur.",
      of: [
        defineArrayMember({
          name: "programmeItem",
          title: "Onderdeel",
          type: "object",
          fields: [i18nString("title", { title: "Titel", required: true }), i18nText("text", { title: "Tekst", max: 200 })],
          preview: { select: { title: "title", text: "text" }, prepare: ({ title, text }) => ({ title: pick(title), subtitle: pick(text) }) },
        }),
      ],
      validation: (rule) => rule.max(6).warning("Max. 6 onderdelen"),
    }),

    /* ---- praktisch ---- */
    defineField({
      name: "prices",
      title: "Prijzen",
      type: "array",
      group: "practical",
      of: [
        defineArrayMember({
          name: "price",
          title: "Prijs",
          type: "object",
          fields: [
            i18nString("label", { title: "Omschrijving", required: true, description: "bv. “Gedeelde kamer (2 pers.)”." }),
            defineField({ name: "amount", title: "Bedrag (€)", type: "number", validation: (rule) => rule.required().min(0) }),
          ],
          preview: { select: { label: "label", amount: "amount" }, prepare: ({ label, amount }) => ({ title: pick(label), subtitle: `€ ${amount ?? "…"}` }) },
        }),
      ],
    }),
    i18nLines("included", { title: "Inbegrepen", group: "practical" }),
    i18nLines("notIncluded", { title: "Niet inbegrepen", group: "practical" }),

    /* ---- afsluiter ---- */
    i18nString("closingTitle", { title: "Kop", group: "closing", description: "bv. “Klaar om te duiken?”." }),
    i18nText("closingText", { title: "Tekst", group: "closing", max: 160 }),
    mediaField("closingPhoto", { title: "Slotfoto", group: "closing" }),

    /* ---- after the retreat / seo ---- */
    defineField({
      name: "participantCount",
      title: "Aantal deelnemers (na afloop)",
      type: "number",
      group: ["basics", "recap"],
      description: "Getoond op de kaart en de pagina van voorbije retreats.",
      hidden: ({ document }) => !document?.endDate || String(document.endDate) >= new Date().toISOString().slice(0, 10),
    }),
    mediaArrayField("recapPhotos", {
      title: "Foto's achteraf",
      group: "recap",
      description: "Na de retreat: zoveel foto's als je wil (leeg = sfeer- en plekfoto's). Na de einddatum toont de pagina enkel openingsbeeld, notendop, de feiten (plaats, begeleiding, prijs, deelnemers) en deze foto's; Programma, Praktisch en Afsluiter verschijnen alleen bij komende retreats.",
    }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo", group: "seo" }),
  ],
  orderings: [
    { title: "Startdatum (nieuwste)", name: "startDesc", by: [{ field: "startDate", direction: "desc" }] },
    { title: "Startdatum (eerstvolgende)", name: "startAsc", by: [{ field: "startDate", direction: "asc" }] },
  ],
  preview: {
    select: { title: "title", place: "place", start: "startDate", end: "endDate", media: "cardPhoto.image" },
    prepare: ({ title, place, start, end, media }) => ({
      title: pick(title) ?? "Nieuwe retreat",
      subtitle: [start && end ? `${start} → ${end}` : start, pick(place)].filter(Boolean).join(" · "),
      media,
    }),
  },
});
