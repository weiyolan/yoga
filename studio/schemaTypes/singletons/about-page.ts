import { UsersIcon } from "@sanity/icons/Users";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nString, i18nText, pick } from "../shared/i18n";

/**
 * Over ons: Rita & Philippe (big) → Wat ons drijft (summary + values) → Onze fijne samenwerkingen.
 * The collaborators aren't picked here: every person who isn't a founder shows up automatically.
 */
export const aboutPage = defineType({
  name: "aboutPage",
  title: "Over ons-pagina",
  type: "document",
  icon: UsersIcon,
  fields: [
    defineField({ name: "hero", title: "Openingsbeeld", type: "hero", validation: (rule) => rule.required() }),
    defineField({
      name: "founders",
      title: "Rita & Philippe",
      type: "array",
      description: "Yoga, Zen & Tonic zelf: groot bovenaan. Iedereen anders bij Personen staat automatisch onder Samenwerkingen.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "person" }], options: { filter: 'kind == "founder" || !defined(kind)' } })],
      validation: (rule) => [rule.required(), rule.unique()],
    }),

    /* ---- wat ons drijft ---- */
    i18nString("driveTitle", { title: "Wat ons drijft: kop", description: "Leeg = “Wat ons drijft”." }),
    i18nText("driveText", { title: "Wat ons drijft: samenvatting", max: 200, description: "Eén zin, bv. “Yoga die je goed doet, zonder regeltjes of zweverig gedoe.”." }),
    defineField({
      name: "values",
      title: "Waarden",
      type: "array",
      description: "Zoveel als nodig, bv. Niets moet · Echt & oprecht · Buiten zijn.",
      of: [
        defineArrayMember({
          name: "value",
          title: "Waarde",
          type: "object",
          fields: [i18nString("title", { title: "Kop", required: true }), i18nText("text", { title: "Tekst", max: 200 })],
          preview: { select: { title: "title", text: "text" }, prepare: ({ title, text }) => ({ title: pick(title), subtitle: pick(text) }) },
        }),
      ],
    }),
    defineField({ name: "principlesVideoUrl", title: "Video bij Wat ons drijft (optioneel)", type: "url", description: "Trage loop via Vimeo of Mux." }),

    /* ---- samenwerkingen ---- */
    i18nString("collaboratorsTitle", { title: "Samenwerkingen: kop", description: "Leeg = “Onze fijne samenwerkingen”." }),
    i18nText("collaboratorsIntro", { title: "Samenwerkingen: intro", max: 250, description: "De lijst zelf komt uit Personen → Samenwerkingen." }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Over ons" }) },
});
