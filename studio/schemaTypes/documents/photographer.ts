import { EyeOpenIcon } from "@sanity/icons/EyeOpen";
import { defineField, defineType } from "sanity";

/**
 * Who took a photo: made once (Fotobank → Fotografen), then picked on each photo in the Fotobank. The name (and link to
 * their website) shows small under the photo in the full-screen view and goes to Google as the
 * photo's maker.
 */
export const photographer = defineType({
  name: "photographer",
  title: "Fotograaf",
  type: "document",
  icon: EyeOpenIcon,
  fields: [
    defineField({ name: "name", title: "Naam", type: "string", description: "Zoals de fotograaf genoemd wil worden, bv. “Milo Weiler”. Staat klein onder de foto op volledig scherm.", validation: (rule) => rule.required() }),
    defineField({ name: "website", title: "Website", type: "url", description: "Optioneel: de naam onder de foto linkt hiernaartoe (bv. https://miloweiler.com).", validation: (rule) => rule.uri({ scheme: ["https", "http"] }) }),
  ],
  preview: { select: { title: "name", subtitle: "website" } },
});
