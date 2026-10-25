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
    defineField({ name: "name", title: "Naam", type: "string", description: "Persoon of bedrijf (bv. Foodie Jive).", validation: (rule) => rule.required() }),
    defineField({
      name: "kind",
      title: "Soort",
      type: "string",
      options: { list: PERSON_KINDS, layout: "radio" },
      initialValue: "collaborator",
      validation: (rule) => rule.required(),
    }),
    i18nString("role", { title: "Rol", required: true, description: "bv. “Yoga- & Pilatesleraar”, “Freedive-instructeur, CMAS & AIDA”, “Catering”." }),
    mediaField("portrait", { title: "Portret", required: true, description: "Voor een bedrijf: logo of teamfoto." }),
    mediaField("object", {
      title: "Voorwerp",
      description: "Optioneel, enkel voor Rita & Philippe: voorwerp dat eerst getoond wordt; bij hover verschijnt het portret (bv. opgerolde yogamat, duikbril).",
      hidden: ({ document }) => document?.kind !== "founder",
    }),
    i18nBlocks("bio", { title: "Over", description: "3–4 zinnen." }),
    defineField({ name: "website", title: "Website", type: "url", validation: (rule) => rule.uri({ scheme: ["https", "http"] }) }),
    defineField({
      name: "links",
      title: "Andere links",
      type: "array",
      description: "bv. twee Instagram-accounts (yoga + kunst).",
      of: [
        defineArrayMember({
          name: "link",
          title: "Link",
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", description: "bv. “Instagram (yoga)”.", validation: (rule) => rule.required() }),
            defineField({ name: "url", title: "URL", type: "url", validation: (rule) => rule.required().uri({ scheme: ["https", "http", "mailto"] }) }),
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
      description: "Toont deze samenwerking (tijdelijk) niet in de lijst op Over ons. Als begeleider bij een retreat blijft ze zichtbaar.",
      hidden: ({ document }) => document?.kind === "founder",
    }),
    defineField({ name: "orderRank", title: "Volgorde", type: "number", description: "Optioneel: laag = eerst in de lijst. Leeg = alfabetisch.", hidden: ({ document }) => document?.kind === "founder" }),
  ],
  orderings: [{ title: "Naam", name: "name", by: [{ field: "name", direction: "asc" }] }],
  preview: {
    select: { title: "name", role: "role", media: "portrait.image", hidden: "hidden" },
    prepare: ({ title, role, media, hidden }) => ({ title, subtitle: [pick(role), hidden ? "verborgen" : null].filter(Boolean).join(" · "), media }),
  },
});
