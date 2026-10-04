import { defineArrayMember, defineField, defineType } from "sanity";

/** Short rich text: paragraphs, bold/italic and links. Localized via internationalizedArray. */
export const simpleBlockContent = defineType({
  name: "simpleBlockContent",
  title: "Tekst",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [{ title: "Normaal", value: "normal" }],
      lists: [{ title: "Opsomming", value: "bullet" }],
      marks: {
        decorators: [
          { title: "Vet", value: "strong" },
          { title: "Cursief", value: "em" },
        ],
        annotations: [
          defineArrayMember({
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              defineField({
                name: "href",
                type: "url",
                validation: (rule) => rule.required().uri({ scheme: ["http", "https", "mailto", "tel"], allowRelative: true }),
              }),
            ],
          }),
        ],
      },
    }),
  ],
});
