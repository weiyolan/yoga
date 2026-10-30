import { CalendarIcon } from "@sanity/icons/Calendar";
import { ClipboardIcon } from "@sanity/icons/Clipboard";
import { EditIcon } from "@sanity/icons/Edit";
import { HeartIcon } from "@sanity/icons/Heart";
import { ImagesIcon } from "@sanity/icons/Images";
import { InfoOutlineIcon } from "@sanity/icons/InfoOutline";
import { PinIcon } from "@sanity/icons/Pin";
import { SearchIcon } from "@sanity/icons/Search";
import { StarIcon } from "@sanity/icons/Star";
import { SunIcon } from "@sanity/icons/Sun";
import { ThListIcon } from "@sanity/icons/ThList";
import { UsersIcon } from "@sanity/icons/Users";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nLines, i18nString, i18nText, pick } from "../shared/i18n";
import { mediaArrayField, mediaField } from "../shared/media";
import { RetreatOverviewInput } from "../../components/PageOverview";

/**
 * A retreat. Sections follow the detail page (and the Dahab Facebook event):
 * notendop · de plek · de mensen · het programma · praktisch · klaar om te duiken?
 * Upcoming vs. past is derived from `endDate`, never stored.
 * Past retreats show hero, notendop, facts (where, hosts, participants: no price) and recap photos only.
 */
export const retreat = defineType({
  name: "retreat",
  title: "Retreat",
  type: "document",
  icon: CalendarIcon,
  // on top: the page from top to bottom, what's filled in per part + a progress bar (components/PageOverview.tsx)
  components: { input: RetreatOverviewInput },
  // one tab per part of the page, in page order; it opens on Basis (“Alle velden” = everything at once)
  groups: [
    { name: "basics", title: "Basis", icon: InfoOutlineIcon, default: true },
    { name: "photos", title: "Beelden", icon: ImagesIcon },
    { name: "nutshell", title: "Notendop", icon: SunIcon },
    { name: "place", title: "De plek", icon: PinIcon },
    { name: "people", title: "De mensen", icon: UsersIcon },
    { name: "programme", title: "Programma", icon: ThListIcon },
    { name: "practical", title: "Praktisch", icon: ClipboardIcon },
    { name: "signup", title: "Inschrijven", icon: EditIcon },
    { name: "closing", title: "Afsluiter", icon: HeartIcon },
    { name: "recap", title: "Achteraf", icon: StarIcon },
    { name: "seo", title: "SEO", icon: SearchIcon },
  ],
  fieldsets: [
    { name: "dates", title: "Wanneer" },
    { name: "where", title: "Waar" },
    { name: "seats", title: "Plaatsen & prijs", description: "Vrije plaatsen op de site = Max. deelnemers − Geboekt − Extra bezet. Niets meer vrij: “volzet” + wachtlijst." },
  ],
  fields: [
    /* ---- basis ---- */
    i18nString("title", {
      title: "Titel",
      group: "basics",
      required: true,
      max: 60,
      description: "De naam van de retreat: op de kaarten (Retreats, Home, menu), op de inschrijfpagina, in de mails en in Google. Op de retreatpagina zelf staat de titel van het openingsbeeld. bv. “Dahab: Yoga & Freediving”.",
    }),
    defineField({
      name: "slug",
      title: "Slug (webadres)",
      type: "slug",
      group: "basics",
      options: {
        source: (doc) =>
          `${pick(doc.title as never) ?? ""} ${String(doc.startDate ?? "").slice(0, 4)}`,
        maxLength: 60,
      },
      description: "Het webadres van de retreatpagina: /retreats/<slug>. Klik “Generate” (titel + jaar). Na publicatie liever niet meer wijzigen: gedeelde links werken dan niet meer.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "startDate",
      title: "Van",
      type: "date",
      group: "basics",
      fieldset: "dates",
      description: "Eerste dag. De datums staan bovenaan de retreatpagina, op de kaarten, op de inschrijfpagina en in de bevestigingsmail ({datum}).",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "Tot en met",
      type: "date",
      group: "basics",
      fieldset: "dates",
      description: "Laatste dag. Na deze datum wordt de retreat vanzelf “voorbij”: zwart-wit kaart bij voorbije retreats en een kortere terugblik-pagina zonder inschrijven en zonder prijs.",
      validation: (rule) =>
        rule.required().custom((end, ctx) => {
          const start = ctx.document?.startDate as string | undefined;
          return !start || !end || end >= start
            ? true
            : "Einddatum ligt vóór de startdatum";
        }),
    }),
    i18nString("place", {
      title: "Plaats",
      group: "basics",
      fieldset: "where",
      required: true,
      description: "De plaats, bovenaan de retreatpagina en in de zijkolom bij “Waar”, op de uitgelichte retreat op Home, de inschrijfpagina en de deelafbeelding. bv. “Dahab”.",
    }),
    i18nString("country", { title: "Land", group: "basics", fieldset: "where", required: true, description: "Het land, naast de plaats op de retreatpagina en ook op de kaarten bij Retreats en Home en in het menu. bv. “Egypte”." }),
    defineField({
      name: "venue",
      title: "Verblijf",
      type: "string",
      group: "basics",
      fieldset: "where",
      description: "Optioneel: waar jullie verblijven, in de zijkolom bij “Verblijf” op de retreatpagina (en voor Google). bv. “Nour Boutique Hotel”.",
    }),
    defineField({
      name: "capacity",
      title: "Max. deelnemers",
      type: "number",
      group: "basics",
      fieldset: "seats",
      description: "Hoeveel plaatsen er zijn. Hiermee toont de site “nog 5 plaatsen” of “volzet” (kaarten, retreatpagina, inschrijfpagina) en “max. 12 deelnemers” bij Praktisch.",
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: "booked",
      title: "Geboekt (automatisch)",
      type: "number",
      group: "basics",
      fieldset: "seats",
      readOnly: true,
      description:
        "Niet zelf in te vullen: telt vanzelf de bevestigde inschrijvingen. Niet zichtbaar op de site, maar gaat af van de vrije plaatsen.",
    }),
    defineField({
      name: "bookedExtra",
      title: "Extra bezet (manueel)",
      type: "number",
      group: "basics",
      fieldset: "seats",
      description:
        "Plaatsen die buiten de site geboekt zijn (bv. 2 via telefoon): gaan af van de vrije plaatsen op de site. Negatief = plaatsen vrijgeven. Zelf niet zichtbaar.",
      validation: (rule) => rule.integer(),
    }),
    defineField({
      name: "priceFrom",
      title: "Prijs vanaf (€)",
      type: "number",
      group: "basics",
      fieldset: "seats",
      description: "De laagste prijs, als “vanaf € …” bovenaan en in de zijkolom van de retreatpagina, op de kaarten, de inschrijfpagina en de deelafbeelding. Niet getoond bij een voorbije retreat (blijft hier bewaard voor een volgende editie).",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "signupUrl",
      title: "Inschrijflink",
      type: "url",
      group: "signup",
      description:
        "Optioneel: waar de knoppen “Inschrijven” op de retreatpagina naartoe gaan, bv. de site van een partner. Leeg = het inschrijfformulier op deze site.",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "signupForm",
      title: "Inschrijfformulier",
      type: "reference",
      to: [{ type: "signupForm" }],
      group: "signup",
      description:
        "Welke vragen het formulier op de inschrijfpagina van deze retreat stelt (bv. “Yoga & Freediving”). Leeg = het standaardformulier.",
    }),
    defineField({
      name: "confirmationMail",
      title: "Bevestigingsmail",
      type: "reference",
      to: [{ type: "confirmationMail" }],
      group: "signup",
      description:
        "Welke mail de deelnemer krijgt na het inschrijven voor deze retreat (of op de wachtlijst). Leeg = de standaardmail.",
    }),
    // Old separate card photo: the cards now use the opening photo (Openingsbeeld → Foto); kept only as a fallback.
    mediaField("cardPhoto", {
      title: "Foto op de kaart",
      group: "basics",
      hidden: true,
      description: "Oud veld: de kaarten gebruiken nu de foto van het openingsbeeld. Enkel nog reserve als die ontbreekt.",
    }),
    defineField({
      name: "hero",
      title: "Openingsbeeld",
      type: "hero",
      group: "photos",
      description: "De grote foto met titel bovenaan de retreatpagina. Dezelfde foto staat op de kaarten (Retreats, Home, menu), de inschrijfpagina, de mails en de deelafbeelding.",
      validation: (rule) => rule.required(),
    }),
    mediaArrayField("moodPhotos", {
      title: "Sfeerfoto's",
      group: "photos",
      max: 4,
      description: "3–4 foto's in een blok direct onder het openingsbeeld op de retreatpagina; klikken vergroot ze. Bij een voorbije retreat reserve als “Foto's achteraf” leeg is.",
    }),

    /* ---- notendop ---- */
    i18nString("nutshellTitle", { title: "Kop", group: "nutshell", max: 90, description: "De kop van het blok “In een notendop” op de retreatpagina. Staat ook als teaser bij de uitgelichte retreat op Home en helpt de Google-tekst." }),
    i18nText("nutshellText", {
      title: "Intro",
      group: "nutshell",
      required: true,
      max: 400,
      description: "De introtekst in het blok “In een notendop” op de retreatpagina: waar gaat deze retreat over? Wordt ook de Google-beschrijving als “SEO & delen” leeg is.",
    }),
    i18nLines("highlights", {
      title: "Hoogtepunten",
      group: "nutshell",
      description: "Een lijstje met vinkjes onder de intro in het blok “In een notendop” op de retreatpagina. Max. 5.",
    }),

    /* ---- de plek ---- */
    i18nString("placeTitle", { title: "Kop", group: "place", description: "De kop van het blok “De plek” op de retreatpagina (komende retreats). Leeg met lege tekst = het blok valt weg." }),
    i18nText("placeText", { title: "Tekst", group: "place", max: 500, description: "De tekst in het blok “De plek” op de retreatpagina: de omgeving, het verblijf, de sfeer." }),
    mediaArrayField("placePhotos", { title: "Foto's", group: "place", max: 2, description: "Twee foto's naast elkaar onder de tekst in het blok “De plek” op de retreatpagina; klikken vergroot ze." }),

    /* ---- de mensen ---- */
    defineField({
      name: "hosts",
      title: "Begeleiding",
      type: "array",
      group: "people",
      description: "Wie de retreat begeleidt: met portret, naam en rol in het blok “De mensen” en met naam in de zijkolom op de retreatpagina. Kies uit Personen.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "person" }] })],
      validation: (rule) => rule.unique(),
    }),

    /* ---- programma ---- */
    defineField({
      name: "programme",
      title: "Programma",
      type: "array",
      group: "programme",
      description: "Het blok “Programma” op de retreatpagina (komende retreats): een lijstje met de hoogtepunten, geen dagprogramma per uur.",
      of: [
        defineArrayMember({
          name: "programmeItem",
          title: "Onderdeel",
          type: "object",
          fields: [
            i18nString("title", { title: "Titel", required: true, description: "Vetgedrukt begin van het punt in het blok “Programma” op de retreatpagina, bv. “Freediving”." }),
            i18nText("text", { title: "Tekst", max: 200, description: "Optioneel: korte uitleg na de titel, op dezelfde regel in het blok “Programma” op de retreatpagina." }),
          ],
          preview: {
            select: { title: "title", text: "text" },
            prepare: ({ title, text }) => ({
              title: pick(title),
              subtitle: pick(text),
            }),
          },
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
      description: "De prijzen in het blok “Praktisch” op de retreatpagina. Ze worden ook de keuzes bij “Kamer” op het inschrijfformulier.",
      of: [
        defineArrayMember({
          name: "price",
          title: "Prijs",
          type: "object",
          fields: [
            i18nString("label", {
              title: "Omschrijving",
              required: true,
              description: "Waarvoor deze prijs geldt, naast het bedrag bij “Praktisch” en als keuze op het inschrijfformulier. bv. “Gedeelde kamer (2 pers.)”.",
            }),
            defineField({
              name: "amount",
              title: "Bedrag (€)",
              type: "number",
              description: "De prijs in euro, vóór de omschrijving bij “Praktisch” en in de keuzelijst op het inschrijfformulier.",
              validation: (rule) => rule.required().min(0),
            }),
          ],
          preview: {
            select: { label: "label", amount: "amount" },
            prepare: ({ label, amount }) => ({
              title: pick(label),
              subtitle: `€ ${amount ?? "…"}`,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: "deposit",
      title: "Voorschot (€)",
      type: "number",
      group: "practical",
      description:
        "Optioneel: bedrag om de plaats vast te leggen. Niet op de site, enkel in de bevestigingsmail als {voorschot} (zie Bevestigingsmails → Betaalgegevens). Leeg = geen betaalblok.",
      validation: (rule) => rule.min(0),
    }),
    i18nLines("included", { title: "Inbegrepen", group: "practical", description: "Lijstje “Inbegrepen” in het blok “Praktisch” op de retreatpagina, bv. “Verblijf en ontbijt”." }),
    i18nLines("notIncluded", { title: "Niet inbegrepen", group: "practical", description: "Lijstje “Niet inbegrepen” in het blok “Praktisch” op de retreatpagina, bv. “Vluchten”." }),

    /* ---- afsluiter ---- */
    i18nString("closingTitle", {
      title: "Kop",
      group: "closing",
      description: "De grote titel op de slotfoto onderaan de retreatpagina, boven de knop “Inschrijven”. bv. “Klaar om te duiken?”. Leeg = de titel van de retreat.",
    }),
    i18nText("closingText", { title: "Tekst", group: "closing", max: 160, description: "Optioneel: korte zin onder de titel op de slotfoto onderaan de retreatpagina, net boven de knop “Inschrijven”." }),
    mediaField("closingPhoto", { title: "Slotfoto", group: "closing", description: "De grote foto onderaan de retreatpagina, achter de afsluiter. Staat ook op de inschrijfpagina. Leeg = de foto van het openingsbeeld." }),

    /* ---- after the retreat / seo ---- */
    defineField({
      name: "participantCount",
      title: "Aantal deelnemers (na afloop)",
      type: "number",
      group: ["basics", "recap"],
      description: "Na afloop: hoeveel mensen er meegingen. Staat op de kaart bij voorbije retreats (bv. “12 deelnemers”) en bij de feiten op de terugblik-pagina.",
      hidden: ({ document }) =>
        !document?.endDate ||
        String(document.endDate) >= new Date().toISOString().slice(0, 10),
    }),
    mediaArrayField("recapPhotos", {
      title: "Foto's achteraf",
      group: "recap",
      description:
        "Na de retreat: de fotomozaïek op de terugblik-pagina, zoveel als je wil (leeg = sfeer- en plekfoto's). Een voorbije retreat toont enkel openingsbeeld, notendop, feiten en deze foto's.",
    }),
    defineField({
      name: "seo",
      title: "SEO & delen",
      type: "seo",
      group: "seo",
      description: "Hoe deze retreat in Google en bij gedeelde links (WhatsApp, Facebook, …) verschijnt. Niet zichtbaar op de pagina zelf. Leeg = titel, notendop en openingsfoto.",
    }),
  ],
  orderings: [
    {
      title: "Startdatum (nieuwste)",
      name: "startDesc",
      by: [{ field: "startDate", direction: "desc" }],
    },
    {
      title: "Startdatum (eerstvolgende)",
      name: "startAsc",
      by: [{ field: "startDate", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      place: "place",
      start: "startDate",
      end: "endDate",
      media: "hero.photo.image",
      card: "cardPhoto.image",
    },
    prepare: ({ title, place, start, end, media, card }) => ({
      title: pick(title) ?? "Nieuwe retreat",
      subtitle: [start && end ? `${start} → ${end}` : start, pick(place)]
        .filter(Boolean)
        .join(" · "),
      media: media ?? card,
    }),
  },
});
