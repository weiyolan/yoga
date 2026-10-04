import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { SimpleBlockContent } from "@/sanity/types";

const components: PortableTextComponents = {
  marks: {
    link: ({ value, children }) => {
      const to: string = value?.href ?? "#";
      const external = /^https?:/.test(to);
      return (
        <a href={to} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {children}
        </a>
      );
    },
  },
  list: { bullet: ({ children }) => <ul className="ticks">{children}</ul> },
};

/** Short rich text (simpleBlockContent). */
export function RichText({ value }: { value: SimpleBlockContent | null | undefined }) {
  return value?.length ? <PortableText value={value} components={components} /> : null;
}

/** Plain textarea text: blank lines → paragraphs. */
export function Paragraphs({ text, className, style }: { text: string | null | undefined; className?: string; style?: React.CSSProperties }) {
  if (!text) return null;
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => (
      <p key={i} className={className} style={style}>
        {p}
      </p>
    ));
}
