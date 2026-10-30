import { ActivityIcon } from "@sanity/icons/Activity";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { CommentIcon } from "@sanity/icons/Comment";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { ImageIcon } from "@sanity/icons/Image";
import { ImagesIcon } from "@sanity/icons/Images";
import { SearchIcon } from "@sanity/icons/Search";
import { UsersIcon } from "@sanity/icons/Users";
import { HomeIcon } from "@sanity/icons/Home";
import { defineField, defineType } from "sanity";
import { i18nString, i18nText } from "../shared/i18n";
import { mediaArrayField, mediaField } from "../shared/media";
import { list, overviewInput, photo, t, type Section } from "../../components/PageOverview";

/** The Home page from top to bottom (app/[lang]/page.tsx). */
const SECTIONS: Section[] = [
  { group: "top", title: "Bovenaan", where: "De grote foto met titel en de knoppen Retreats / Lessen, daaronder de uitgelichte retreat.", checks: [photo("Openingsfoto", "hero.photo"), t("Titel op de foto", "hero.title"), t("Ondertitel", "hero.subtitle")] },
  { group: "intro", title: "Intro", where: "Het gecentreerde blok “Wie zijn wij” met de link naar Over ons.", checks: [t("Kop", "introTitle"), t("Intro", "intro")] },
  { group: "retreats", title: "Retreats", where: "De kop boven de (max. 3) komende retreats. Leeg = standaardkop.", optional: true, checks: [t("Kop", "retreatsTitle")] },
  { group: "lessons", title: "Lessen", where: "Het blok lessen met de tegels van de stijlen en de studio's. Leeg = standaardtekst.", optional: true, checks: [t("Kop", "lessonsTitle"), t("Tekst", "lessonsText")] },
  { group: "testimonials", title: "Testimonials", where: "De slider “Wat deelnemers zeggen”: elke testimonial met “Op Home” aan (Contact → Testimonials).", optional: true, checks: [t("Kop", "testimonialsTitle")] },
  { group: "about", title: "Wie zijn wij", where: "Het blok met de foto van Rita & Philippe onderaan, met de link naar Over ons.", checks: [t("Kop", "aboutTitle"), t("Tekst", "aboutText"), photo("Foto", "aboutPhoto")] },
  { group: "instagram", title: "Instagram", where: "De 6 foto's onderaan Home, met de link naar Instagram. Leeg = vanzelf de 6 nieuwste “Uitgelichte” foto's uit de Fotobank.", optional: true, checks: [list("Foto's", "instagramPhotos")] },
  { group: "seo", title: "SEO", where: "Google en delen op WhatsApp / Facebook. Leeg = ondertitel of intro.", optional: true, checks: [t("Titel", "seo.title"), t("Beschrijving", "seo.description")] },
];
const HomeOverviewInput = overviewInput({ label: "Homepagina", sections: SECTIONS, storageKey: "home-overview-open" });

export const homePage = defineType({
  name: "homePage",
  title: "Home",
  type: "document",
  icon: HomeIcon,
  groups: [
    { name: "top", title: "Bovenaan", icon: ImageIcon, default: true },
    { name: "intro", title: "Intro", icon: DocumentTextIcon },
    { name: "retreats", title: "Retreats", icon: CalendarIcon },
    { name: "lessons", title: "Lessen", icon: ActivityIcon },
    { name: "testimonials", title: "Testimonials", icon: CommentIcon },
    { name: "about", title: "Wie zijn wij", icon: UsersIcon },
    { name: "instagram", title: "Instagram", icon: ImagesIcon },
    { name: "seo", title: "SEO", icon: SearchIcon },
  ],
  // on top: the page from top to bottom, what's filled in per part + a progress bar (components/PageOverview.tsx)
  components: { input: HomeOverviewInput },
  fields: [
    defineField({ group: "top", name: "hero", title: "Openingsbeeld", type: "hero", description: "De grote foto met titel bovenaan de homepage, met knoppen naar Retreats en Lessen. De ondertitel dient ook als reserve voor de Google-beschrijving.", validation: (rule) => rule.required() }),
    defineField({
      group: "top",
      name: "featuredRetreat",
      title: "Uitgelichte retreat",
      type: "reference",
      to: [{ type: "retreat" }],
      description: "Retreat die groot (foto, data, prijs, knop) bovenaan Home onder het openingsbeeld staat. Leeg = automatisch de eerstvolgende retreat die niet volzet is.",
    }),
    i18nString("introTitle", { group: "intro", title: "Intro: kop", max: 90, description: "Grote titel van het gecentreerde blok “Wie zijn wij” op Home, onder de uitgelichte retreat. Leeg = geen titel." }),
    i18nText("intro", { group: "intro", title: "Intro", required: true, max: 400, description: "Eén paragraaf over Yoga, Zen & Tonic in het gecentreerde introblok op Home. Ook de Google-beschrijving als SEO en ondertitel leeg zijn." }),
    i18nString("introLink", { group: "intro", title: "Intro: link naar Over ons", description: "Tekst van de link naar Over ons onder het introblok op Home. Leeg = “Maak kennis met Rita & Philippe”." }),
    i18nString("retreatsTitle", { group: "retreats", title: "Kop retreats", description: "Titel boven de kaarten met de (max. 3) komende retreats op Home. Leeg = “Waar gaan we naartoe?”." }),
    i18nString("lessonsTitle", { group: "lessons", title: "Lessen: kop", description: "Titel van het blok lessen op Home, met de tegels van de lesstijlen en de studio's. Leeg = “Rita geeft ook les”." }),
    i18nText("lessonsText", { group: "lessons", title: "Lessen: tekst", max: 250, description: "Tekst onder de kop van het blok lessen op Home, boven de tegels. 1–2 zinnen: buiten de retreats geeft Rita les in een paar Antwerpse studio's. Leeg = standaardtekst." }),
    i18nString("testimonialsTitle", { group: "testimonials", title: "Kop testimonials", description: "Klein label boven het blok testimonials op Home. Leeg = “Wat deelnemers zeggen”. Welke testimonials er staan, kies je met “Op Home” in Contact → Testimonials." }),
    i18nString("aboutTitle", { group: "about", title: "Wie zijn wij: kop", description: "Titel van het blok met foto “Wie zijn wij” onderaan Home, naast de foto van Rita & Philippe. Leeg = geen titel." }),
    i18nText("aboutText", { group: "about", title: "Wie zijn wij: tekst", max: 300, description: "Korte tekst in het blok met foto “Wie zijn wij” onderaan Home, boven de link naar Over ons." }),
    mediaField("aboutPhoto", { group: "about", title: "Wie zijn wij: foto", description: "Foto in het blok “Wie zijn wij” onderaan Home, ook gebruikt in het menu Over ons (Rita & Philippe)." }),
    mediaArrayField("instagramPhotos", { group: "instagram", title: "Foto's Instagram-blok", max: 6, description: "De foto's onderaan Home bij de link naar Instagram (max. 6), in deze volgorde; sleep om te wisselen. Leeg = vanzelf de 6 nieuwst geüploade foto's met “Uitgelicht” aan." }),
    defineField({ group: "seo", name: "seo", title: "SEO & delen", type: "seo", description: "Niet zichtbaar op de pagina zelf: titel, beschrijving en beeld voor Google en bij delen op sociale media. Leeg = ondertitel of intro." }),
  ],
  preview: { prepare: () => ({ title: "Home" }) },
});
