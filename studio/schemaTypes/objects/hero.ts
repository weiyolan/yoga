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
    mediaField("photo", { title: "Foto", required: true, description: "Elke pagina start met één grote foto." }),
    defineField({
      name: "videoUrl",
      title: "Video-loop (optioneel)",
      type: "url",
      description: "Stille loop van 10–15 s via Vimeo of Mux. De foto blijft de poster en de fallback.",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),
    i18nString("title", { title: "Titel", required: true, max: 60 }),
    i18nText("subtitle", { title: "Ondertitel", max: 160 }),
  ],
  preview: {
    select: { title: "title", media: "photo.image" },
    prepare: ({ title, media }) => ({ title: pick(title) ?? "Openingsbeeld", media }),
  },
});
