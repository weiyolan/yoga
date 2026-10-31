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
                        "Toont deze vraag ook onderaan de komende retreatpagina's, in “Goed om te weten”. Niets aangevinkt = de eerste 4 vragen.",
                    }),
                    defineField({
                      name: "retreats",
                      title: "Enkel bij deze retreats (optioneel)",
                      type: "array",
                      of: [defineArrayMember({ type: "reference", to: [{ type: "retreat" }], options: { disableNew: true } })],
                      hidden: ({ parent }) => !(parent as { onRetreat?: boolean } | undefined)?.onRetreat,
                      description:
                        "Leeg = op elke retreatpagina. Kies je retreats (bv. Dahab voor een vraag over duiken), dan staat de vraag enkel daar, en ook bij hun volgende edities (dahab-2026 → dahab-2027).",
                    }),
                  ],
                  preview: {
                    select: { q: "question", a: "answer", on: "onRetreat", r0: "retreats.0.title", r1: "retreats.1.title", r2: "retreats.2.title" },
                    prepare: ({ q, a, on, r0, r1, r2 }) => {
                      const only = [r0, r1].map((r) => pick(r)).filter(Boolean);
                      return {
                        title: `${on ? "★ " : ""}${pick(q) ?? "Vraag"}`,
                        subtitle: on && only.length ? `Enkel: ${only.join(", ")}${r2 ? ", …" : ""}` : pick(a),
                      };
                    },
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
