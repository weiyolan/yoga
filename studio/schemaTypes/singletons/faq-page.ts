import { HelpCircleIcon } from "@sanity/icons/HelpCircle";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nString, i18nText, pick } from "../shared/i18n";

/**
 * Veelgestelde vragen (/faq): questions in groups (e.g. Retreats, Lessen, Betalen & annuleren).
 * Shown as fold-out answers; Google gets them as FAQ data. Linked from the footer and Contact.
 */
export const faqPage = defineType({
  name: "faqPage",
  title: "FAQ",
  type: "document",
  icon: HelpCircleIcon,
  fields: [
    i18nString("title", {
      title: "Kop",
      required: true,
      description: "Grote titel bovenaan de FAQ-pagina; ook de paginatitel in Google als je bij SEO niets invult. bv. “Veelgestelde vragen”.",
    }),
    i18nText("intro", { title: "Intro (optioneel)", max: 240, description: "Korte tekst onder de kop van de FAQ-pagina, boven de vragen; ook reserve-omschrijving voor Google. Leeg = geen intro." }),
    defineField({
      name: "groups",
      title: "Groepen",
      type: "array",
      description: "De vragen op de FAQ-pagina, per onderwerp gegroepeerd. Sleep om de volgorde op de site te wijzigen.",
      of: [
        defineArrayMember({
          name: "faqGroup",
          title: "Groep",
          type: "object",
          fields: [
            i18nString("title", {
              title: "Titel",
              required: true,
              description: "Tussentitel boven deze groep vragen op de FAQ-pagina (enkel getoond als er meer dan één groep is). bv. “Retreats”.",
            }),
            defineField({
              name: "items",
              title: "Vragen",
              type: "array",
              description: "De vragen in deze groep, in deze volgorde op de FAQ-pagina.",
              of: [
                defineArrayMember({
                  name: "faqItem",
                  title: "Vraag",
                  type: "object",
                  fields: [
                    i18nString("question", {
                      title: "Vraag",
                      required: true,
                      max: 140,
                      description: "De vraag zoals bezoekers ze aanklikken op de FAQ-pagina (en eventueel op de retreatpagina's); Google krijgt ze ook te zien.",
                    }),
                    i18nText("answer", {
                      title: "Antwoord",
                      required: true,
                      max: 900,
                      description: "Het antwoord dat openklapt onder de vraag op de FAQ-pagina (en eventueel op de retreatpagina's). Een lege regel = nieuwe alinea.",
                    }),
                    defineField({
                      name: "onRetreat",
                      title: "Ook tonen op de retreatpagina's",
                      type: "boolean",
                      initialValue: false,
                      description:
                        "Toont deze vraag ook onderaan elke komende retreatpagina, in “Goed om te weten”. Niets aangevinkt = de eerste 4 vragen.",
                    }),
                  ],
                  preview: {
                    select: { q: "question", a: "answer", on: "onRetreat" },
                    prepare: ({ q, a, on }) => ({
                      title: `${on ? "★ " : ""}${pick(q) ?? "Vraag"}`,
                      subtitle: pick(a),
                    }),
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: { title: "title", items: "items" },
            prepare: ({ title, items }) => ({
              title: pick(title) ?? "Groep",
              subtitle: `${(items as unknown[] | undefined)?.length ?? 0} vragen`,
            }),
          },
        }),
      ],
    }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo", description: "Niet zichtbaar op de pagina zelf: titel, omschrijving en deelfoto van de FAQ-pagina in Google en bij delen via WhatsApp of sociale media." }),
  ],
  preview: { prepare: () => ({ title: "FAQ" }) },
});
