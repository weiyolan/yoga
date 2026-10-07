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
    defineField({ name: "hero", title: "Openingsbeeld", type: "hero", validation: (rule) => rule.required() }),
    i18nString("introTitle", { title: "Intro: kop", max: 90 }),
    i18nText("intro", { title: "Intro", required: true, max: 400, description: "Eén paragraaf over Yoga, Zen & Tonic." }),
    defineField({
      name: "featuredRetreat",
      title: "Uitgelichte retreat",
      type: "reference",
      to: [{ type: "retreat" }],
      description: "Leeg = automatisch de eerstvolgende retreat.",
    }),
    defineField({
      name: "testimonials",
      title: "Testimonials",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "testimonial" }] })],
      validation: (rule) => [rule.unique(), rule.max(3).warning("2–3 is genoeg")],
    }),
    i18nString("aboutTitle", { title: "Wie zijn wij: kop" }),
    i18nText("aboutText", { title: "Wie zijn wij: tekst", max: 300 }),
    mediaField("aboutPhoto", { title: "Wie zijn wij: foto" }),
    i18nString("introLink", { title: "Intro: link naar Over ons", description: "Leeg = “Maak kennis met Rita & Philippe”." }),
    i18nString("retreatsTitle", { title: "Kop retreats", description: "Leeg = “Waar gaan we naartoe?”." }),
    i18nString("lessonsTitle", { title: "Kop lessen", description: "Leeg = “Wat kan je volgen?”." }),
    i18nString("testimonialsTitle", { title: "Kop testimonials", description: "Leeg = “Wat deelnemers zeggen”." }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Home" }) },
});
