import { CommentIcon } from "@sanity/icons/Comment";
import { defineField, defineType } from "sanity";
import { i18nString, i18nText, pick } from "../shared/i18n";

/** A short quote from a participant. Picked on the Home page (max. 3). */
export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  icon: CommentIcon,
  fields: [
    i18nText("quote", { title: "Citaat", required: true, max: 200, description: "De tekst op een kaartje in de slider “Wat deelnemers zeggen” op Home (als je deze testimonial daar kiest). Kort en echt, in de woorden van de deelnemer." }),
    defineField({ name: "name", title: "Naam", type: "string", description: "Staat onder het citaat op Home, bv. “Sofie” of “Sofie D.”. Vraag even of de persoon akkoord is.", validation: (rule) => rule.required() }),
    defineField({ name: "retreat", title: "Retreat", type: "reference", to: [{ type: "retreat" }], description: "Optioneel: over welke retreat het gaat. Op Home staat dan bv. “Eifel 2025” (titel + jaar) naast de naam onder het citaat." }),
    i18nString("context", { title: "Of andere context", description: "Optioneel: eigen tekst naast de naam onder het citaat op Home, bv. “Lessen”. Gaat voor op de retreat hierboven." }),
  ],
  preview: {
    select: { quote: "quote", name: "name", retreat: "retreat.title" },
    prepare: ({ quote, name, retreat }) => ({ title: pick(quote), subtitle: [name, pick(retreat)].filter(Boolean).join(" · ") }),
  },
});
