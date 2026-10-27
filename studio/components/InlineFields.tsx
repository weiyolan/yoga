import { ErrorOutlineIcon } from "@sanity/icons/ErrorOutline";
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";
import { Box, Stack, Text } from "@sanity/ui";
import { createContext, useContext, type ReactNode } from "react";
import type { FieldProps, SchemaType } from "sanity";

/**
 * Compact documents (a retreat): short fields as one row, title + help on the left, the input on
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

/** title (may hold the NL | EN tabs) + help on the left, input + its errors/warnings on the right */
export function InlineField({ props, title }: { props: FieldProps; title?: ReactNode }) {
  const issues = (props.validation ?? []).filter((v) => v.level === "error" || v.level === "warning");
  return (
    <div className="inline-field" data-testid={`inline-${props.name}`}>
      <style>{CSS}</style>
      <div className="row">
        <Stack gap={2} className="head">
          <Text as="label" size={1} weight="medium">
            {title ?? props.title}
          </Text>
          {props.description ? (
            <Text size={0} muted>
              {props.description}
            </Text>
          ) : null}
        </Stack>
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
