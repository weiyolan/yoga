import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { defineArrayMember, defineField, defineType } from "sanity";
import { AUDIENCES } from "../../../lib/contacts";
import { i18nBlocks, i18nString } from "../shared/i18n";
import { mediaField } from "../shared/media";

/**
 * Nieuwsbrief: a mail to the contact book (lib/newsletter-issue.ts). Write it, check the preview on
 * the right (+ a test mail to yourself), publish, then “Nieuwsbrief versturen” (actions/newsletter.tsx).
 * Everyone gets it in their own language (EN empty = NL) with their own unsubscribe link.
 */
export const newsletter = defineType({
  name: "newsletter",
  title: "Nieuwsbrief",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    { name: "content", title: "Inhoud", default: true },
    { name: "send", title: "Versturen" },
  ],
  fields: [
    defineField({ name: "title", title: "Naam", type: "string", group: "content", description: "Intern, bv. “Nieuwe retreats 2027”.", validation: (rule) => rule.required() }),
    i18nString("subject", { title: "Onderwerp", group: "content", required: true, max: 90, description: "Wat ze in hun inbox zien. Gebruik {naam} voor hun voornaam." }),
    mediaField("image", { title: "Foto bovenaan", group: "content", description: "Breed beeld (wordt 2:1 bijgesneden)." }),
    i18nString("heading", { title: "Titel", group: "content", description: "Grote titel boven de tekst. Optioneel." }),
    i18nBlocks("body", { title: "Tekst", group: "content", required: true, description: "Begin bv. met “Dag {naam},” (hun voornaam; zonder naam wordt het “Dag,”). Vet, cursief, links en opsommingen kunnen." }),
    defineField({
      name: "retreats",
      title: "Retreats in de kijker",
      type: "array",
      group: "content",
      description: "Verschijnen als kaartjes (foto, datum, link) onder de tekst.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "retreat" }], options: { disableNew: true } })],
      validation: (rule) => rule.unique().max(6),
    }),
    i18nString("buttonLabel", { title: "Knop: tekst", group: "content", description: "Optioneel, bv. “Bekijk alle retreats”." }),
    defineField({
      name: "buttonUrl",
      title: "Knop: link",
      type: "url",
      group: "content",
      description: "Een pagina van de site als pad, bv. /retreats of /lessen (dan opent elk zijn eigen taal), of een volledige link.",
      validation: (rule) => rule.uri({ scheme: ["https", "http", "mailto"], allowRelative: true }),
    }),
    defineField({
      name: "audience",
      title: "Naar wie",
      type: "array",
      group: "send",
      of: [defineArrayMember({ type: "string" })],
      options: { list: AUDIENCES.map(({ value, title }) => ({ value, title })), layout: "grid" },
      initialValue: ["subscribers", "participants"],
      description: AUDIENCES.map((a) => `${a.title}: ${a.description}`).join(" "),
      validation: (rule) => rule.required().min(1),
    }),
    defineField({ name: "sentAt", title: "Verstuurd op", type: "datetime", group: "send", readOnly: true }),
    defineField({ name: "sentCount", title: "Aantal ontvangers", type: "number", group: "send", readOnly: true }),
  ],
  orderings: [{ title: "Nieuwste eerst", name: "createdDesc", by: [{ field: "_createdAt", direction: "desc" }] }],
  preview: {
    select: { title: "title", sentAt: "sentAt", sentCount: "sentCount", media: "image.image" },
    prepare: ({ title, sentAt, sentCount, media }) => ({ title: title ?? "Nieuwsbrief", subtitle: sentAt ? `Verstuurd ${sentAt.slice(0, 10)} · ${sentCount ?? 0} ontvangers` : "Nog niet verstuurd", media }),
  },
});
