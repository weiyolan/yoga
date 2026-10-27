import { HomeIcon } from "@sanity/icons/Home";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nString, i18nText } from "../shared/i18n";
import { mediaField } from "../shared/media";

export const homePage = defineType({
  name: "homePage",
  title: "Home",
  type: "document",
  icon: HomeIcon,
  fields: [
    defineField({ name: "hero", title: "Openingsbeeld", type: "hero", description: "De grote foto met titel bovenaan de homepage, met knoppen naar Retreats en Lessen. De ondertitel dient ook als reserve voor de Google-beschrijving.", validation: (rule) => rule.required() }),
    i18nString("introTitle", { title: "Intro: kop", max: 90, description: "Grote titel van het gecentreerde blok “Wie zijn wij” op Home, onder de uitgelichte retreat. Leeg = geen titel." }),
    i18nText("intro", { title: "Intro", required: true, max: 400, description: "Eén paragraaf over Yoga, Zen & Tonic in het gecentreerde introblok op Home. Ook de Google-beschrijving als SEO en ondertitel leeg zijn." }),
    defineField({
      name: "featuredRetreat",
      title: "Uitgelichte retreat",
      type: "reference",
      to: [{ type: "retreat" }],
      description: "Retreat die groot (foto, data, prijs, knop) bovenaan Home onder het openingsbeeld staat. Leeg = automatisch de eerstvolgende retreat die niet volzet is.",
    }),
    defineField({
      name: "testimonials",
      title: "Testimonials",
      type: "array",
      description: "Getuigenissen die eerst getoond worden in het blok testimonials op Home; daarna volgen automatisch de recentste goedgekeurde reviews (4★+).",
      of: [defineArrayMember({ type: "reference", to: [{ type: "testimonial" }] })],
      validation: (rule) => [rule.unique(), rule.max(3).warning("2–3 is genoeg")],
    }),
    i18nString("aboutTitle", { title: "Wie zijn wij: kop", description: "Titel van het blok met foto “Wie zijn wij” onderaan Home, naast de foto van Rita & Philippe. Leeg = geen titel." }),
    i18nText("aboutText", { title: "Wie zijn wij: tekst", max: 300, description: "Korte tekst in het blok met foto “Wie zijn wij” onderaan Home, boven de link naar Over ons." }),
    mediaField("aboutPhoto", { title: "Wie zijn wij: foto", description: "Foto in het blok “Wie zijn wij” onderaan Home, ook gebruikt in het menu Over ons (Rita & Philippe)." }),
    i18nString("introLink", { title: "Intro: link naar Over ons", description: "Tekst van de link naar Over ons onder het introblok op Home. Leeg = “Maak kennis met Rita & Philippe”." }),
    i18nString("retreatsTitle", { title: "Kop retreats", description: "Titel boven de kaarten met de (max. 3) komende retreats op Home. Leeg = “Waar gaan we naartoe?”." }),
    i18nString("lessonsTitle", { title: "Lessen: kop", description: "Titel van het blok lessen op Home, met de tegels van de lesstijlen en de studio's. Leeg = “Rita geeft ook les”." }),
    i18nText("lessonsText", { title: "Lessen: tekst", max: 250, description: "Tekst onder de kop van het blok lessen op Home, boven de tegels. 1–2 zinnen: buiten de retreats geeft Rita les in een paar Antwerpse studio's. Leeg = standaardtekst." }),
    i18nString("testimonialsTitle", { title: "Kop testimonials", description: "Klein label boven het blok testimonials op Home. Leeg = “Wat deelnemers zeggen”." }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo", description: "Niet zichtbaar op de pagina zelf: titel, beschrijving en beeld voor Google en bij delen op sociale media. Leeg = ondertitel of intro." }),
  ],
  preview: { prepare: () => ({ title: "Home" }) },
});
