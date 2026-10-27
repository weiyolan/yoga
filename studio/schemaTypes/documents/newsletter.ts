import { BlockContentIcon } from "@sanity/icons/BlockContent";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { LinkIcon } from "@sanity/icons/Link";
import { ThLargeIcon } from "@sanity/icons/ThLarge";
import { defineArrayMember, defineField, defineType } from "sanity";
import { AUDIENCES } from "../../../lib/contacts";
import { i18nBlocks, i18nString, i18nText, pick } from "../shared/i18n";
import { mediaField } from "../shared/media";

/** A link: a page of the site as a path (opens in their language) or a full link. */
const urlField = (description: string) =>
  defineField({
    name: "url",
    title: "Link",
    type: "url",
    description,
    validation: (rule) => rule.required().uri({ scheme: ["https", "http", "mailto"], allowRelative: true }),
  });
const PATH_HINT = "Een pagina van de site als pad, bv. /retreats, /lessen of /contact (dan opent elk zijn eigen taal), of een volledige link.";

/** One of the blocks under the text: a retreat / lesstijl card, an own card, a button, more text. */
const BLOCKS = [
  defineArrayMember({
    type: "reference",
    title: "Kaart: retreat of lesstijl",
    to: [{ type: "retreat" }, { type: "yogaClass" }],
    options: { disableNew: true },
  }),
  defineArrayMember({
    name: "newsletterCard",
    title: "Kaart: eigen",
    type: "object",
    icon: ThLargeIcon,
    fields: [
      mediaField("photo", { title: "Foto", description: "Wordt 2:1 bijgesneden." }),
      i18nString("title", { title: "Titel", required: true, max: 80 }),
      i18nText("text", { title: "Tekst", max: 240, description: "Optioneel, één of twee zinnen." }),
      urlField(PATH_HINT),
      i18nString("more", { title: "Linktekst", description: "Leeg = “Meer info”." }),
    ],
    preview: {
      select: { title: "title", url: "url", media: "photo.image" },
      prepare: ({ title, url, media }) => ({ title: pick(title) ?? "Kaart", subtitle: `Kaart · ${url ?? "geen link"}`, media: media ?? ThLargeIcon }),
    },
  }),
  defineArrayMember({
    name: "newsletterButton",
    title: "Knop",
    type: "object",
    icon: LinkIcon,
    fields: [i18nString("label", { title: "Tekst", required: true, max: 40, description: "bv. “Bekijk alle retreats”." }), urlField(PATH_HINT)],
    preview: {
      select: { title: "label", url: "url" },
      prepare: ({ title, url }) => ({ title: pick(title) ?? "Knop", subtitle: `Knop · ${url ?? "geen link"}`, media: LinkIcon }),
    },
  }),
  defineArrayMember({
    name: "newsletterText",
    title: "Tekst",
    type: "object",
    icon: BlockContentIcon,
    fields: [i18nBlocks("body", { title: "Tekst", required: true, description: "bv. een PS of een tweede onderwerp tussen de kaartjes. {naam} kan hier ook." })],
    preview: {
      select: { body: "body" },
      prepare: ({ body }) => {
        const items = (body ?? []) as { language?: string; value?: { children?: { text?: string }[] }[] }[];
        const blocks = (items.find((i) => i.language === "nl") ?? items[0])?.value ?? [];
        return { title: blocks.map((b) => b.children?.map((c) => c.text).join("")).join(" ").slice(0, 80) || "Tekst", subtitle: "Tekst", media: BlockContentIcon };
      },
    },
  }),
];

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
      name: "blocks",
      title: "Onder de tekst",
      type: "array",
      group: "content",
      description: "Kaartjes (een retreat, een lesstijl of een eigen kaart met foto en link), knoppen en extra tekst, in deze volgorde. Versleep om te herschikken.",
      of: BLOCKS,
      validation: (rule) => rule.max(12),
    }),
    // before “Onder de tekst” (still sent if filled in; content:v10 moves them there)
    defineField({
      name: "retreats",
      title: "Retreats in de kijker (oud)",
      type: "array",
      group: "content",
      deprecated: { reason: "Gebruik “Onder de tekst” (run content:v10 of zet ze er zelf in)." },
      hidden: ({ value }) => !value?.length,
      of: [defineArrayMember({ type: "reference", to: [{ type: "retreat" }], options: { disableNew: true } })],
    }),
    i18nString("buttonLabel", { title: "Knop: tekst (oud)", group: "content", hidden: ({ value }) => !(value as unknown[] | undefined)?.length }),
    defineField({ name: "buttonUrl", title: "Knop: link (oud)", type: "url", group: "content", hidden: ({ value }) => !value, validation: (rule) => rule.uri({ scheme: ["https", "http", "mailto"], allowRelative: true }) }),
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
