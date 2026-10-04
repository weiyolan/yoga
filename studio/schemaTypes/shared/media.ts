import { defineArrayMember, defineField } from "sanity";

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
};

export const mediaField = (name: string, { required, ...opts }: Opts = {}) =>
  defineField({
    name,
    type: "reference",
    to: [{ type: "mediaItem" }],
    ...opts,
    validation: (rule) => (required ? rule.required().error("Kies een foto uit de Fotobank") : rule),
  });

export const mediaArrayField = (name: string, { required, min, max, ...opts }: Opts & { min?: number; max?: number } = {}) =>
  defineField({
    name,
    type: "array",
    of: [defineArrayMember({ type: "reference", to: [{ type: "mediaItem" }] })],
    options: { layout: "grid" },
    ...opts,
    validation: (rule) => [
      rule.unique(),
      ...(required ? [rule.required()] : []),
      ...(min ? [rule.min(min)] : []),
      ...(max ? [rule.max(max).warning(`Max. ${max} foto's: één sterk beeld zegt meer`)] : []),
    ],
  });
