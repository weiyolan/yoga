import { Box, Button } from "@sanity/ui";
import { useState } from "react";
import type { ArrayOfObjectsInputProps } from "sanity";
import { useShownLanguages } from "./languageStore";

const language = (m: ArrayOfObjectsInputProps["members"][number]) => (m.kind === "item" ? (m.item.value as { language?: string })?.language ?? "" : "");

/**
 * Localized field, folded: only the languages picked in the navbar toggle (default NL) are shown;
 * the rest sit behind a small per-field toggle so long pages take less space. Opens by itself when
 * a hidden language has a validation problem (e.g. an EN text that's too long).
 */
export function FoldedI18nInput(props: ArrayOfObjectsInputProps) {
  const shownLanguages = useShownLanguages();
  const [open, setOpen] = useState(false);
  const hidden = props.members.filter((m) => !shownLanguages.includes(language(m)));
  const invalid = hidden.some((m) => m.kind === "item" && m.item.validation.length > 0);
  const all = open || invalid;
  return (
    <>
      {props.renderDefault(all ? props : { ...props, members: props.members.filter((m) => shownLanguages.includes(language(m))) })}
      {hidden.length > 0 && !invalid && (
        <Box marginTop={2}>
          <Button mode="bleed" fontSize={1} padding={2} text={all ? "Vertalingen verbergen ▾" : `Vertalingen (${hidden.length}) ▸`} onClick={() => setOpen(!open)} />
        </Box>
      )}
    </>
  );
}
