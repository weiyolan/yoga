import { ErrorOutlineIcon } from "@sanity/icons/ErrorOutline";
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";
import { HelpCircleIcon } from "@sanity/icons/HelpCircle";
import { Box, Flex, Text } from "@sanity/ui";
import { Popover } from "@sanity/ui/popover";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { FieldProps, SchemaType } from "sanity";

/**
 * Every field: its help text behind a small ? after the title (Help, via I18nTabsField).
 * Compact documents (a retreat): short fields as one row, title + ? on the left, the input on
 * the right; long texts, lists and groups stay full width. On by a provider around the document's
 * form (RetreatOverviewInput); I18nTabsField (form.components.field) does the layout, also for the NL | EN strings.
 * Also on a phone; only a very narrow column (< 300px) puts the title on top again.
 */
export const InlineFields = createContext(false);
export const useInlineFields = () => useContext(InlineFields);

const SHORT = new Set(["string", "number", "url", "date", "datetime", "slug", "reference", "internationalizedArrayString"]);
const names = (t: SchemaType | undefined): string[] => (t ? [t.name, ...names(t.type as SchemaType | undefined)] : []);

/** One line is enough: short text, number, date, link, slug, a picked document (not long text, lists, groups, on/off). */
export function isShort(props: FieldProps) {
  const chain = names(props.schemaType);
  if (props.name === "value" || chain.includes("text") || chain.includes("boolean")) return false;
  const opts = props.schemaType.options as { list?: unknown[] } | undefined;
  if (opts?.list?.length) return false;
  return chain.some((n) => SHORT.has(n));
}

const CSS = `
/* the form puts 32px between fields: rows sit closer together */
.inline-field { container-type: inline-size; margin-block: -10px; }
.inline-field > .row { display: grid; grid-template-columns: minmax(92px, 32%) minmax(0, 1fr); gap: 4px 12px; align-items: start; }
.inline-field > .row > .head { padding-top: 9px; }
@container (max-width: 300px) { .inline-field > .row { grid-template-columns: minmax(0, 1fr); } .inline-field > .row > .head { padding-top: 0; } }
`;

/** A small ? next to the title: the help text on hover, or on tap (phone); tap again / elsewhere closes it. */
export function Help({ text }: { text: ReactNode }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  // a tap elsewhere closes it
  useEffect(() => {
    if (!pinned) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setPinned(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [pinned]);
  return (
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
        <Text size={1} muted>
          {text}
        </Text>
      }
    >
      <button
        ref={ref}
        type="button"
        aria-label="Uitleg"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => setPinned((p) => !p)}
        // same size everywhere (px, not the title's size), raised like a superscript
        style={{ all: "unset", cursor: "help", display: "inline-flex", alignSelf: "flex-start", fontSize: 15, lineHeight: 0, color: "var(--card-muted-fg-color)", padding: 1, marginLeft: 1, transform: "translateY(-30%)" }}
      >
        <HelpCircleIcon style={{ fontSize: 15, width: "1em", height: "1em" }} />
      </button>
    </Popover>
  );
}

/** title (may hold the NL | EN tabs) + help on the left, input + its errors/warnings on the right */
export function InlineField({ props, title }: { props: FieldProps; title?: ReactNode }) {
  const issues = (props.validation ?? []).filter((v) => v.level === "error" || v.level === "warning");
  return (
    <div className="inline-field" data-testid={`inline-${props.name}`}>
      <style>{CSS}</style>
      <div className="row">
        <Flex className="head" align="center" gap={1} wrap="wrap">
          <Text as="label" size={1} weight="medium">
            {title ?? props.title}
          </Text>
          {/* a custom title (NL | EN tabs) brings its own ? right after the name */}
          {props.description && !title ? <Help text={props.description} /> : null}
        </Flex>
        <Box>
          {props.children}
          {issues.map((v, i) => (
            <Box key={i} marginTop={2}>
              <Text size={0} style={{ color: v.level === "error" ? "var(--card-badge-critical-fg-color, #e5484d)" : "var(--card-badge-caution-fg-color, #c7a21c)" }}>
                {v.level === "error" ? <ErrorOutlineIcon /> : <WarningOutlineIcon />} {v.message}
              </Text>
            </Box>
          ))}
        </Box>
      </div>
    </div>
  );
}
