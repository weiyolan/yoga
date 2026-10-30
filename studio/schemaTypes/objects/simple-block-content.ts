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
                description: "Waar deze link in de tekst naartoe gaat (op de site of in de mail). Een volledige link, een pad op de site zoals /contact, of mailto:/tel:.",
                validation: (rule) => rule.required().uri({ scheme: ["http", "https", "mailto", "tel"], allowRelative: true }),
              }),
            ],
          }),
        ],
      },
    }),
  ],
});
