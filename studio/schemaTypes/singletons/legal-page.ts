import { LockIcon } from "@sanity/icons/Lock";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nString, i18nText, pick } from "../shared/i18n";

/**
 * Legal pages (footer links, sign-up consent): one `legalPage` document per page, with a fixed id.
 * `route` is the key in lib/routes.ts. The same for every retreat, so not part of a retreat.
 */
export const LEGAL_PAGES = [
  { id: "legal-privacy", route: "privacy", title: "Privacyverklaring" },
  { id: "legal-terms", route: "terms", title: "Algemene voorwaarden" },
  { id: "legal-cancellation", route: "cancellation", title: "Annulatievoorwaarden" },
  { id: "legal-cookies", route: "cookies", title: "Cookies" },
] as const;

/** Sections: a heading + plain paragraphs. */
export const legalPage = defineType({
  name: "legalPage",
  title: "Juridische pagina",
  type: "document",
  icon: LockIcon,
  fields: [
    i18nString("title", { title: "Titel", required: true, description: "Grote titel bovenaan deze juridische pagina; ook de paginatitel in Google. De link in de footer heeft een vaste naam." }),
    i18nText("intro", { title: "Intro", description: "Inleidende tekst onder de titel van deze juridische pagina; ook reserve-omschrijving voor Google." }),
    defineField({
      name: "sections",
      title: "Onderdelen",
      type: "array",
      description: "De inhoud van deze juridische pagina: blokken met elk een kop en tekst, in deze volgorde.",
      of: [
        defineArrayMember({
          name: "legalSection",
          title: "Onderdeel",
          type: "object",
          fields: [
            i18nString("title", { title: "Kop", required: true, description: "Tussentitel van dit onderdeel op de juridische pagina, bv. “Welke gegevens bewaren we?”." }),
            i18nText("text", { title: "Tekst", description: "De tekst onder de tussentitel van dit onderdeel. Lege lijn = nieuwe paragraaf." }),
          ],
          preview: { select: { title: "title" }, prepare: ({ title }) => ({ title: pick(title) }) },
        }),
      ],
    }),
    defineField({ name: "updatedAt", title: "Laatst bijgewerkt", type: "date", options: { dateFormat: "D MMMM YYYY" }, description: "Verschijnt onderaan de pagina als “Laatst bijgewerkt op …”. Pas aan als je de tekst wijzigt; leeg = geen datum." }),
    defineField({ name: "seo", title: "SEO & delen", type: "seo", description: "Niet zichtbaar op de pagina zelf: titel, omschrijving en deelfoto van deze juridische pagina in Google en bij delen." }),
  ],
  preview: {
    select: { title: "title", id: "_id" },
    prepare: ({ title, id }) => ({ title: pick(title) ?? LEGAL_PAGES.find((p) => id?.endsWith(p.id))?.title ?? "Juridische pagina" }),
  },
});
