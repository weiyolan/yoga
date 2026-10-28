import { EnvelopeIcon } from "@sanity/icons/Envelope";
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
const PATH_HINT = "Waar de lezer van de nieuwsbrief terechtkomt als hij hierop klikt. Een pagina van de site als pad, bv. /retreats, /lessen of /contact (dan opent elk zijn eigen taal), of een volledige link.";

/** One of the blocks under the text: a retreat / lesstijl card, an own card, a button, more text. */
const BLOCKS = [
  defineArrayMember({
    type: "reference",
    title: "Kaart: retreat of lesstijl",
    to: [{ type: "retreat" }, { type: "yogaClass" }],
    options: { disableNew: true },
    description: "Een kaartje in de nieuwsbrief met foto, titel en “Meer info” van een bestaande retreat (met data en land) of lesstijl. Klikken opent die retreat of de Lessen-pagina.",
  }),
  defineArrayMember({
    name: "newsletterCard",
    title: "Kaart: eigen",
    type: "object",
    icon: ThLargeIcon,
    fields: [
      mediaField("photo", { title: "Foto", description: "Foto bovenaan dit kaartje in de nieuwsbrief. Wordt 2:1 bijgesneden. Optioneel." }),
      i18nString("title", { title: "Titel", required: true, max: 80, description: "Titel van dit kaartje in de nieuwsbrief, onder de foto. {naam} kan hier ook." }),
      i18nText("text", { title: "Tekst", max: 240, description: "Korte tekst onder de titel van het kaartje in de nieuwsbrief. Optioneel, één of twee zinnen." }),
      urlField(PATH_HINT),
      i18nString("more", { title: "Linktekst", description: "De klikbare tekst onderaan het kaartje in de nieuwsbrief. Leeg = “Meer info”." }),
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
    fields: [i18nString("label", { title: "Tekst", required: true, max: 40, description: "Wat er op de knop in de nieuwsbrief staat, bv. “Bekijk alle retreats”." }), urlField(PATH_HINT)],
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
    fields: [i18nBlocks("body", { title: "Tekst", required: true, description: "Extra tekst in de nieuwsbrief op deze plek tussen de kaartjes, bv. een PS of een tweede onderwerp. {naam} kan hier ook." })],
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
    { name: "content", title: "Inhoud", icon: DocumentTextIcon, default: true },
    { name: "send", title: "Versturen", icon: EnvelopeIcon },
  ],
  fields: [
    defineField({ name: "title", title: "Naam", type: "string", group: "content", description: "Niet op de site: enkel om de nieuwsbrief terug te vinden in de Studio, bv. “Nieuwe retreats 2027”. Lezers zien dit niet.", validation: (rule) => rule.required() }),
    i18nString("subject", { title: "Onderwerp", group: "content", required: true, max: 90, description: "Het onderwerp van de nieuwsbrief-mail: wat ze in hun inbox zien. Gebruik {naam} voor hun voornaam." }),
    mediaField("image", { title: "Foto bovenaan", group: "content", description: "Brede foto helemaal bovenaan de nieuwsbrief-mail, boven de titel. Wordt 2:1 bijgesneden. Optioneel." }),
    i18nString("heading", { title: "Titel", group: "content", description: "Grote titel in de nieuwsbrief-mail, onder de foto en boven de tekst. Optioneel." }),
    i18nBlocks("body", { title: "Tekst", group: "content", required: true, description: "De hoofdtekst van de nieuwsbrief-mail, onder de titel. Begin bv. met “Dag {naam},” (hun voornaam; zonder naam wordt het “Dag,”). Vet, cursief, links en opsommingen kunnen." }),
    defineField({
      name: "blocks",
      title: "Onder de tekst",
      type: "array",
      group: "content",
      description: "Wat in de nieuwsbrief-mail onder de tekst komt: kaartjes (een retreat, een lesstijl of een eigen kaart met foto en link), knoppen en extra tekst, in deze volgorde. Versleep om te herschikken.",
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
      description: "Oud veld: retreatkaartjes onderaan de nieuwsbrief-mail (worden nog meegestuurd). Zet ze liever in “Onder de tekst”.",
      hidden: ({ value }) => !value?.length,
      of: [defineArrayMember({ type: "reference", to: [{ type: "retreat" }], options: { disableNew: true } })],
    }),
    i18nString("buttonLabel", { title: "Knop: tekst (oud)", group: "content", description: "Oud veld: tekst van de knop onderaan de nieuwsbrief-mail (wordt nog meegestuurd). Gebruik liever een “Knop” in “Onder de tekst”.", hidden: ({ value }) => !(value as unknown[] | undefined)?.length }),
    defineField({ name: "buttonUrl", title: "Knop: link (oud)", type: "url", group: "content", description: "Oud veld: waar de oude knop onderaan de nieuwsbrief-mail naartoe gaat. Gebruik liever een “Knop” in “Onder de tekst”.", hidden: ({ value }) => !value, validation: (rule) => rule.uri({ scheme: ["https", "http", "mailto"], allowRelative: true }) }),
    defineField({
      name: "audience",
      title: "Naar wie",
      type: "array",
      group: "send",
      of: [defineArrayMember({ type: "string" })],
      options: { list: AUDIENCES.map(({ value, title }) => ({ value, title })), layout: "grid" },
      initialValue: ["subscribers", "participants"],
      description: `Niet op de site: wie deze nieuwsbrief krijgt als je op “Nieuwsbrief versturen” klikt (wie zich afmeldde nooit). ${AUDIENCES.map((a) => `${a.title}: ${a.description}`).join(" ")}`,
      validation: (rule) => rule.required().min(1),
    }),
    defineField({ name: "sentAt", title: "Verstuurd op", type: "datetime", group: "send", readOnly: true, description: "Niet op de site: wordt automatisch ingevuld bij het versturen, zodat je ziet wanneer deze nieuwsbrief vertrok (en hem niet per ongeluk twee keer stuurt)." }),
    defineField({ name: "sentCount", title: "Aantal ontvangers", type: "number", group: "send", readOnly: true, description: "Niet op de site: wordt automatisch ingevuld bij het versturen, met hoeveel mensen deze nieuwsbrief kregen." }),
  ],
  orderings: [{ title: "Nieuwste eerst", name: "createdDesc", by: [{ field: "_createdAt", direction: "desc" }] }],
  preview: {
    select: { title: "title", sentAt: "sentAt", sentCount: "sentCount", media: "image.image" },
    prepare: ({ title, sentAt, sentCount, media }) => ({ title: title ?? "Nieuwsbrief", subtitle: sentAt ? `Verstuurd ${sentAt.slice(0, 10)} · ${sentCount ?? 0} ontvangers` : "Nog niet verstuurd", media }),
  },
});
