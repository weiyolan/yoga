import { UserIcon } from "@sanity/icons/User";
import { defineArrayMember, defineField, defineType } from "sanity";
import { i18nBlocks, i18nString, pick } from "../shared/i18n";
import { mediaField } from "../shared/media";

export const PERSON_KINDS = [
  { title: "Rita & Philippe (Yoga, Zen & Tonic)", value: "founder" },
  { title: "Samenwerking", value: "collaborator" },
];

/**
 * Rita & Philippe (`founder`) and everyone they work with (`collaborator`: teachers, instructors,
 * cooks, a catering company…). Collaborators appear on Over ons automatically and can be picked
 * as hosts on a retreat.
 */
export const person = defineType({
  name: "person",
  title: "Persoon",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({ name: "name", title: "Naam", type: "string", description: "Persoon of bedrijf (bv. Foodie Jive). Staat op Over ons en bij “De mensen” en “Begeleiding” op de retreatpagina’s waar je deze persoon kiest.", validation: (rule) => rule.required() }),
    defineField({
      name: "kind",
      title: "Soort",
      type: "string",
      options: { list: PERSON_KINDS, layout: "radio" },
      initialValue: "collaborator",
      description: "Rita & Philippe = bovenaan Over ons (als ze daar gekozen zijn). Samenwerking = vanzelf in de lijst met samenwerkingen op Over ons, en te kiezen als begeleider bij een retreat.",
      validation: (rule) => rule.required(),
    }),
    i18nString("role", { title: "Rol", required: true, description: "Korte regel onder de naam op Over ons en bij “De mensen” op de retreatpagina, bv. “Yoga- & Pilatesleraar”, “Freedive-instructeur, CMAS & AIDA”, “Catering”." }),
    mediaField("portrait", { title: "Portret", required: true, description: "De foto op Over ons (bij samenwerkingen rond) en bij “De mensen” op de retreatpagina. Voor een bedrijf: logo of teamfoto." }),
    mediaField("object", {
      title: "Voorwerp",
      description: "Optioneel, enkel voor Rita & Philippe, bovenaan Over ons: voorwerp dat eerst getoond wordt; bij hover verschijnt het portret (bv. opgerolde yogamat, duikbril). Leeg = een getekende mat of duikbril.",
      hidden: ({ document }) => document?.kind !== "founder",
    }),
    i18nBlocks("bio", { title: "Over", description: "Korte voorstelling (3–4 zinnen) onder naam en rol op Over ons. Niet op de retreatpagina’s." }),
    defineField({ name: "website", title: "Website", type: "url", description: "Optioneel: verschijnt als link “Website” bij deze samenwerking op Over ons. Niet getoond bij Rita & Philippe.", validation: (rule) => rule.uri({ scheme: ["https", "http"] }) }),
    defineField({
      name: "links",
      title: "Andere links",
      type: "array",
      description: "Optioneel: extra links naast de website bij deze samenwerking op Over ons, bv. twee Instagram-accounts (yoga + kunst). Niet getoond bij Rita & Philippe.",
      of: [
        defineArrayMember({
          name: "link",
          title: "Link",
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", description: "De klikbare tekst van de link op Over ons, bv. “Instagram (yoga)”.", validation: (rule) => rule.required() }),
            defineField({ name: "url", title: "URL", type: "url", description: "Waar de link op Over ons naartoe gaat: een webadres (https://…) of mailto:naam@voorbeeld.be.", validation: (rule) => rule.required().uri({ scheme: ["https", "http", "mailto"] }) }),
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        }),
      ],
    }),
    defineField({
      name: "hidden",
      title: "Verbergen op Over ons",
      type: "boolean",
      initialValue: false,
      description: "Aan = deze samenwerking staat (tijdelijk) niet in de lijst op Over ons. Als begeleider bij een retreat blijft ze wel zichtbaar op die retreatpagina.",
      hidden: ({ document }) => document?.kind === "founder",
    }),
    defineField({ name: "orderRank", title: "Volgorde", type: "number", description: "Optioneel: plaats in de lijst met samenwerkingen op Over ons; laag = eerst. Leeg = na de genummerde, alfabetisch.", hidden: ({ document }) => document?.kind === "founder" }),
  ],
  orderings: [{ title: "Naam", name: "name", by: [{ field: "name", direction: "asc" }] }],
  preview: {
    select: { title: "name", role: "role", media: "portrait.image", hidden: "hidden" },
    prepare: ({ title, role, media, hidden }) => ({ title, subtitle: [pick(role), hidden ? "verborgen" : null].filter(Boolean).join(" · "), media }),
  },
});
