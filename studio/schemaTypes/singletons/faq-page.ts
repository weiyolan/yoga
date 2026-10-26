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
      description: "bv. “Veelgestelde vragen”.",
    }),
    i18nText("intro", { title: "Intro (optioneel)", max: 240 }),
    defineField({
      name: "groups",
      title: "Groepen",
      type: "array",
      of: [
        defineArrayMember({
          name: "faqGroup",
          title: "Groep",
          type: "object",
          fields: [
            i18nString("title", {
              title: "Titel",
              required: true,
              description: "bv. “Retreats”.",
            }),
            defineField({
              name: "items",
              title: "Vragen",
              type: "array",
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
                    }),
                    i18nText("answer", {
                      title: "Antwoord",
                      required: true,
                      max: 900,
                      description: "Een lege regel = nieuwe alinea.",
                    }),
                    defineField({
                      name: "onRetreat",
                      title: "Ook tonen op de retreatpagina's",
                      type: "boolean",
                      initialValue: false,
                      description:
                        "Onderaan elke komende retreat (“Goed om te weten”). Niets aangevinkt = de eerste 4 vragen.",
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
    defineField({ name: "seo", title: "SEO & delen", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "FAQ" }) },
});
