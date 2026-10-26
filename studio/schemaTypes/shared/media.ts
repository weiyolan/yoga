import {
  defineArrayMember,
  defineField,
  type ConditionalProperty,
} from "sanity";
import { MediaArrayInput, MediaRefInput } from "../../components/PhotoPicker";

/**
 * Every image on the site is a `mediaItem` in the Fotobank: uploaded once, with
 * hotspot, alt text and SEO filled in once, then referenced wherever it is used.
 */
type Opts = {
  title?: string;
  description?: string;
  required?: boolean;
  group?: string | string[];
  fieldset?: string;
  hidden?: ConditionalProperty;
};

export const mediaField = (name: string, { required, ...opts }: Opts = {}) =>
  defineField({
    name,
    type: "reference",
    to: [{ type: "mediaItem" }],
    // the chosen photo large + a big grid to choose from (components/PhotoPicker.tsx)
    components: { input: MediaRefInput },
    ...opts,
    validation: (rule) =>
      required ? rule.required().error("Kies een foto uit de Fotobank") : rule,
  });

export const mediaArrayField = (
  name: string,
  { required, min, max, ...opts }: Opts & { min?: number; max?: number } = {},
) =>
  defineField({
    name,
    type: "array",
    of: [
      defineArrayMember({
        type: "reference",
        to: [{ type: "mediaItem" }],
        components: { input: MediaRefInput },
      }),
    ],
    // adding goes through “Kies foto's uit de Fotobank” (several at once); drag to reorder as usual
    options: {
      layout: "grid",
      disableActions: ["add", "addBefore", "addAfter", "duplicate"],
    },
    components: { input: MediaArrayInput },
    ...opts,
    validation: (rule) => [
      rule.unique(),
      ...(required ? [rule.required()] : []),
      ...(min ? [rule.min(min)] : []),
      ...(max
        ? [
            rule
              .max(max)
              .warning(`Max. ${max} foto's: één sterk beeld zegt meer`),
          ]
        : []),
    ],
  });
