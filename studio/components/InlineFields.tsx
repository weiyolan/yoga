import { HelpCircleIcon } from "@sanity/icons/HelpCircle";
import { Text } from "@sanity/ui";
import { Popover } from "@sanity/ui/popover";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FieldProps, SchemaType } from "sanity";

/**
 * Every field: its help text behind a small ? after the title (Help, via I18nTabsField).
 * Short fields (text line, number, date, link, slug, a picked document, NL | EN line) as one row:
 * title + ? + the usual “…” menu on the left, the input on the right. Long texts, lists, groups, on/off
 * and custom inputs stay full width. It's Sanity's own field (renderDefault: comments, “…”, validation,
 * change bars all stay), only laid out as a grid by CSS. A very narrow column (< 300px) stacks again.
 * InlineFields (context) = false switches it off for a part of a form.
 */
export const InlineFields = createContext(true);
export const useInlineFields = () => useContext(InlineFields);

const SHORT = new Set([
  "string",
  "number",
  "url",
  "date",
  "datetime",
  "slug",
  "reference",
  "internationalizedArrayString",
]);
const names = (t: SchemaType | undefined): string[] =>
  t ? [t.name, ...names(t.type as SchemaType | undefined)] : [];

/** One line is enough: short text, number, date, link, slug, a picked document (not long text, lists, groups, on/off, own inputs). */
export function isShort(props: FieldProps) {
  const chain = names(props.schemaType);
  if (
    props.name === "value" ||
    chain.includes("text") ||
    chain.includes("boolean")
  )
    return false;
  const opts = props.schemaType.options as { list?: unknown[] } | undefined;
  if (opts?.list?.length) return false;
  // own inputs (tiles, checkboxes) need the width; the NL | EN plugin's input is fine
  if (
    (props.schemaType.components as { input?: unknown } | undefined)?.input &&
    !chain.includes("internationalizedArrayString")
  )
    return false;
  return chain.some((n) => SHORT.has(n));
}

// the field's own layout: a VStack [header (title | “…” menu), input]. As a grid: title | input | “…”
// (the header is unwrapped with display: contents). The language items inside an NL | EN field keep theirs.
const ROW = `.inline-field [data-ui="VStack"]:has(> [data-ui="Flex"] > [data-ui="fieldHeaderContentBox"]):not(.i18n-tab-item *)`;
const HEAD = `${ROW} > [data-ui="Flex"]:first-child`;
const CSS = `
/* the form puts 32px between fields: rows sit closer together */
.inline-field { container-type: inline-size; margin-block: -10px; }
${ROW} { display: grid !important; grid-template-columns: minmax(80px, 26%) minmax(0, 1fr) auto; column-gap: 8px; row-gap: 4px; align-items: start; }
${HEAD} { display: contents !important; }
${HEAD} > [data-ui="fieldHeaderContentBox"] { grid-column: 1; grid-row: 1; padding-top: 6px; }
${HEAD} > :not([data-ui="fieldHeaderContentBox"]) { grid-column: 3; grid-row: 1; padding-top: 4px; position: static !important; inset: auto !important; }
${ROW} > :not(:first-child) { grid-column: 2; }
${ROW} > :nth-child(2) { grid-row: 1; }
@container (max-width: 300px) {
  ${ROW} { grid-template-columns: minmax(0, 1fr) auto; }
  ${HEAD} > [data-ui="fieldHeaderContentBox"] { padding-top: 0; }
  ${HEAD} > :not([data-ui="fieldHeaderContentBox"]) { grid-column: 2; padding-top: 0; }
  ${ROW} > :not(:first-child) { grid-column: 1 / -1; }
  ${ROW} > :nth-child(2) { grid-row: 2; }
}
`;

/** A small ? next to the title: the help text on hover, or on tap (phone); tap again / elsewhere closes it. */
export function Help({ text }: { text: ReactNode }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  // a tap elsewhere closes it
  useEffect(() => {
    if (!pinned) return;
    const close = (e: PointerEvent) =>
      !ref.current?.contains(e.target as Node) && setPinned(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [pinned]);
  // the gap before the ? is padding: Sanity's title text resets margins
  return (
    <>
      <Popover
        open={hover || pinned}
        portal
        placement="top"
        fallbackPlacements={["bottom", "right"]}
        padding={3}
        radius={2}
        shadow={2}
        style={{ maxWidth: 300 }}
        content={
          <div style={{ maxWidth: 320 }}>
            <Text size={1} muted>
              {text}
            </Text>
          </div>
        }
      >
        <button
          ref={ref}
          type="button"
          aria-label="Uitleg"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={() => setPinned((p) => !p)}
          // same size everywhere (px, not the title's size), on the line of the title
          style={{
            appearance: "none",
            background: "none",
            border: 0,
            font: "inherit",
            cursor: "help",
            display: "inline-flex",
            alignSelf: "center",
            verticalAlign: "middle",
            fontSize: 15,
            lineHeight: 0,
            color: "var(--card-muted-fg-color)",
            padding: "1px 1px 1px 5px",
          }}
        >
          <HelpCircleIcon
            style={{ fontSize: 15, width: "1em", height: "1em" }}
          />
        </button>
      </Popover>
    </>
  );
}

/** Sanity's own field, title (may hold the NL | EN tabs) + ? on the left, input on the right. */
export function InlineField({
  props,
  title,
}: {
  props: FieldProps;
  title?: ReactNode;
}) {
  const t = title ?? (
    <>
      {props.title}
      {props.description ? <Help text={props.description} /> : null}
    </>
  );
  return (
    <div className="inline-field">
      <style>{CSS}</style>
      {props.renderDefault({
        ...props,
        description: undefined,
        title: t as unknown as string,
      })}
    </div>
  );
}
