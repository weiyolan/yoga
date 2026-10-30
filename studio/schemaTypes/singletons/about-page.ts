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
    defineField({ name: "hero", title: "Openingsbeeld", type: "hero", description: "De grote foto met titel bovenaan de Over ons-pagina. Titel en ondertitel dienen ook als reserve voor Google en het deelvoorbeeld.", validation: (rule) => rule.required() }),
    defineField({
      name: "founders",
      title: "Rita & Philippe",
      type: "array",
      description: "Rita & Philippe met foto, rol en bio, groot bovenaan de Over ons-pagina (“Wie zijn wij”). Iedereen anders uit Over ons → Personen komt automatisch onder Samenwerkingen.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "person" }], options: { filter: 'kind == "founder" || !defined(kind)' } })],
      validation: (rule) => [rule.required(), rule.unique()],
    }),

    /* ---- wat ons drijft ---- */
    i18nString("driveTitle", { title: "Wat ons drijft: kop", description: "Titel van het blok “Wat ons drijft” op de Over ons-pagina. Leeg = “Wat ons drijft”." }),
    i18nText("driveText", { title: "Wat ons drijft: samenvatting", max: 200, description: "Korte zin onder de kop van “Wat ons drijft” op de Over ons-pagina; ook reserve-omschrijving voor Google. Eén zin, bv. “Yoga die je goed doet, zonder regeltjes of zweverig gedoe.”." }),
    defineField({
      name: "values",
      title: "Waarden",
      type: "array",
      description: "De waarden als rijtje kop + tekst in het blok “Wat ons drijft” op de Over ons-pagina. Zoveel als nodig, bv. Niets moet · Echt & oprecht · Buiten zijn.",
      of: [
        defineArrayMember({
          name: "value",
          title: "Waarde",
          type: "object",
          fields: [
            i18nString("title", { title: "Kop", required: true, description: "Naam van de waarde, vetgedrukt in “Wat ons drijft” op de Over ons-pagina, bv. “Niets moet”." }),
            i18nText("text", { title: "Tekst", max: 200, description: "Korte uitleg onder de kop van deze waarde in “Wat ons drijft” op de Over ons-pagina." }),
          ],
          preview: { select: { title: "title", text: "text" }, prepare: ({ title, text }) => ({ title: pick(title), subtitle: pick(text) }) },
        }),
      ],
    }),
    defineField({ name: "principlesVideoUrl", title: "Video bij Wat ons drijft (optioneel)", type: "url", description: "Rustige video naast het blok “Wat ons drijft” op de Over ons-pagina. Plak de link van een trage loop via Vimeo of Mux; leeg = geen video." }),

    /* ---- samenwerkingen ---- */
    i18nString("collaboratorsTitle", { title: "Samenwerkingen: kop", description: "Titel van het blok Samenwerkingen onderaan de Over ons-pagina. Leeg = “Onze fijne samenwerkingen”." }),
    i18nText("collaboratorsIntro", { title: "Samenwerkingen: intro", max: 250, description: "Korte inleiding onder de kop Samenwerkingen op de Over ons-pagina. De lijst zelf komt automatisch uit Over ons → Personen." }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo", description: "Niet zichtbaar op de pagina zelf: titel, omschrijving en deelfoto van de Over ons-pagina in Google en bij delen via WhatsApp of sociale media." }),
  ],
  preview: { prepare: () => ({ title: "Over ons" }) },
});
