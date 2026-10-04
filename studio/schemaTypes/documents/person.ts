import { UserIcon } from "@sanity/icons/User";
import { defineField, defineType } from "sanity";
import { i18nBlocks, i18nString, pick } from "../shared/i18n";
import { mediaField } from "../shared/media";

/** Rita, Philippe and guest guides. Referenced from the About page and from retreats. */
export const person = defineType({
  name: "person",
  title: "Persoon",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({ name: "name", title: "Naam", type: "string", validation: (rule) => rule.required() }),
    i18nString("role", { title: "Rol", required: true, description: "bv. “Yoga- & Pilatesleraar”, “Freedive-instructeur, CMAS & AIDA”." }),
    mediaField("portrait", { title: "Portret", required: true }),
    mediaField("object", {
      title: "Voorwerp",
      description: "Optioneel: voorwerp dat eerst getoond wordt; bij hover verschijnt het portret (bv. yogablok, duikbril).",
    }),
    i18nBlocks("bio", { title: "Over", description: "3–4 zinnen." }),
  ],
  preview: {
    select: { title: "name", role: "role", media: "portrait.image" },
    prepare: ({ title, role, media }) => ({ title, subtitle: pick(role), media }),
  },
});
