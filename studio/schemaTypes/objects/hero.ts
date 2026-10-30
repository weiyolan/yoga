import { PresentationIcon } from "@sanity/icons/Presentation";
import { defineField, defineType } from "sanity";
import { i18nString, i18nText, pick } from "../shared/i18n";
import { mediaField } from "../shared/media";

/** Opening of a page: one big photo (optionally a quiet video loop) with a title. */
export const hero = defineType({
  name: "hero",
  title: "Openingsbeeld",
  type: "object",
  icon: PresentationIcon,
  fields: [
    mediaField("photo", { title: "Foto", required: true, description: "De grote foto bovenaan de pagina, achter de titel. Kies een rustige, liggende foto: hij wordt ook gebruikt als deelafbeelding als “SEO & delen” leeg is." }),
    defineField({
      name: "videoUrl",
      title: "Video-loop (optioneel)",
      type: "url",
      description: "Optioneel: een stille videoloop (10–15 s, via Vimeo of Mux) die bovenaan de pagina over de foto speelt. De foto blijft zichtbaar tijdens het laden en als de video niet werkt.",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),
    i18nString("title", { title: "Titel", required: true, max: 60, description: "De grote titel op de foto bovenaan de pagina. Komt ook op de deelafbeelding (WhatsApp, Facebook, …). Kort en sfeervol." }),
    i18nText("subtitle", { title: "Ondertitel", max: 160, description: "Optioneel: korte zin onder de titel op de foto bovenaan de pagina. Komt ook als regel op de deelafbeelding." }),
  ],
  preview: {
    select: { title: "title", media: "photo.image" },
    prepare: ({ title, media }) => ({ title: pick(title) ?? "Openingsbeeld", media }),
  },
});
