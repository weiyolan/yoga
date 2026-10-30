import { CheckmarkIcon } from "@sanity/icons/Checkmark";
import { DotIcon } from "@sanity/icons/Dot";
import { HomeIcon } from "@sanity/icons/Home";
import { LemonIcon } from "@sanity/icons/Lemon";
import { SplitHorizontalIcon } from "@sanity/icons/SplitHorizontal";
import { StringIcon } from "@sanity/icons/String";
import { TextIcon } from "@sanity/icons/Text";
import { ThumbsUpIcon } from "@sanity/icons/ThumbsUp";
import { Box, Card, Checkbox, Flex, Stack, Switch, Text, TextInput } from "@sanity/ui";
import type { ComponentType } from "react";
import { Help } from "./InlineFields";
import { ObjectInputMember, set, setIfMissing, unset, useFormValue, type FieldMember, type ObjectInputProps, type StringInputProps, type TextInputProps } from "sanity";

/** The question types, with an icon and one line of explanation (Inschrijfformulier → Extra vragen). */
export const QUESTION_TYPES: { title: string; value: string; icon: ComponentType; hint: string }[] = [
  { title: "Korte tekst", value: "text", icon: StringIcon, hint: "Eén regel, bv. een naam of datum" },
  { title: "Lange tekst", value: "textarea", icon: TextIcon, hint: "Een open vak voor een langer antwoord" },
  { title: "Ja / nee", value: "yesno", icon: ThumbsUpIcon, hint: "Twee bolletjes: Ja of Nee" },
  { title: "Keuze (één)", value: "choice", icon: DotIcon, hint: "Eén antwoord uit een lijst" },
  { title: "Meerdere keuzes", value: "multi", icon: CheckmarkIcon, hint: "Vinkjes: meerdere antwoorden mogelijk" },
  { title: "Nieuwe stap", value: "section", icon: SplitHorizontalIcon, hint: "Begint een nieuwe pagina met deze titel" },
  { title: "Kamerkeuze", value: "room", icon: HomeIcon, hint: "Uit de prijzen van de retreat" },
  { title: "Dieet / allergieën", value: "diet", icon: LemonIcon, hint: "Open vak, komt in de kolom Dieet" },
];
export const questionType = (v?: string) => QUESTION_TYPES.find((q) => q.value === v);

/** “Soort”: tiles with icon + explanation instead of a row of radio buttons. */
export function QuestionTypeInput(props: StringInputProps) {
  const { value, onChange, readOnly } = props;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 8 }}>
      {QUESTION_TYPES.map((t) => {
        const on = value === t.value;
        return (
          <Card
            key={t.value}
            as="button"
            type="button"
            padding={3}
            radius={2}
            border
            tone={on ? "primary" : "default"}
            selected={on}
            disabled={readOnly}
            onClick={() => onChange(set(t.value))}
            style={{ textAlign: "left", cursor: readOnly ? "default" : "pointer", outline: on ? "2px solid var(--card-focus-ring-color)" : undefined }}
          >
            <Flex gap={3} align="flex-start">
              <Text size={2}>
                <t.icon />
              </Text>
              <Stack gap={2}>
                <Text size={1} weight="semibold">
                  {t.title}
                </Text>
                <Text size={0} muted>
                  {t.hint}
                </Text>
              </Stack>
            </Flex>
          </Card>
        );
      })}
    </div>
  );
}

type I18n = { language?: string; value?: string }[];
type Question = { _key: string; type?: string; label?: I18n; options?: I18n; other?: boolean };
const nl = (v?: I18n) => v?.find((x) => x.language === "nl")?.value?.trim() ?? v?.[0]?.value?.trim() ?? "";

/**
 * “Enkel tonen als …”: tick the answers of the question just above (its Dutch texts) instead of typing them.
 * Stored as before (one answer per line), so lib/signup-form.ts reads it unchanged. A text question above:
 * type the start of the answer.
 */
export function ShowIfInput(props: TextInputProps) {
  const { value, onChange, path, readOnly } = props;
  const questions = (useFormValue(["questions"]) as Question[] | undefined) ?? [];
  const key = (path[1] as { _key?: string })?._key;
  const i = questions.findIndex((q) => q._key === key);
  const prev = i > 0 ? questions[i - 1] : undefined;
  const lines = (value ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const save = (next: string[]) => onChange(next.length ? set(next.join("\n")) : unset());

  if (!prev || prev.type === "section")
    return (
      <Card padding={3} radius={2} tone="transparent" border>
        <Text size={1} muted>
          {prev ? "De vraag hierboven is een nieuwe stap: deze vraag wordt altijd getoond." : "Dit is de eerste vraag: wordt altijd getoond."}
          {lines.length ? ` (Nu ingesteld: ${lines.join(" / ")}; zet de vraag direct onder de vraag waarvan ze afhangt.)` : ""}
        </Text>
      </Card>
    );

  const choices =
    prev.type === "yesno"
      ? ["Ja", "Nee"]
      : prev.type === "choice" || prev.type === "multi"
        ? [...nl(prev.options).split("\n").map((o) => o.trim()).filter(Boolean), ...(prev.other ? ["Andere"] : [])]
        : null;

  return (
    <Stack gap={3}>
      <Text size={1} muted>
        Hangt af van: <b>{nl(prev.label) || "de vraag hierboven"}</b>
      </Text>
      {choices ? (
        <Card padding={3} radius={2} border>
          <Stack gap={3}>
            {choices.map((c) => {
              const on = lines.some((l) => l.toLowerCase() === c.toLowerCase());
              return (
                <Flex key={c} as="label" gap={2} align="center">
                  <Checkbox
                    checked={on}
                    disabled={readOnly}
                    onChange={() => save(on ? lines.filter((l) => l.toLowerCase() !== c.toLowerCase()) : [...lines, c])}
                  />
                  <Text size={1}>{c}</Text>
                </Flex>
              );
            })}
            <Text size={0} muted>
              {lines.length ? `Getoond als het antwoord ${lines.map((l) => `“${l}”`).join(" of ")} is.` : "Niets aangevinkt = altijd tonen."}
            </Text>
          </Stack>
        </Card>
      ) : (
        <Box>
          <TextInput
            value={value ?? ""}
            readOnly={readOnly}
            placeholder="Leeg = altijd tonen; anders: het begin van het antwoord"
            onChange={(e) => onChange(e.currentTarget.value ? set(e.currentTarget.value) : unset())}
          />
        </Box>
      )}
    </Stack>
  );
}

/**
 * An object of on/off options (Standaardvragen, “nog niet inschrijven”) as one compact list of
 * switches with their explanation next to them, instead of a box per toggle. Unset = the field's
 * initialValue, as the site reads it. Other fields (e.g. a text) are shown below as usual.
 */
export function ToggleListInput(props: ObjectInputProps) {
  const { members, onChange } = props;
  const toggles = members.filter((m): m is FieldMember => m.kind === "field" && m.field.schemaType.jsonType === "boolean");
  const rest = members.filter((m) => !toggles.includes(m as FieldMember));
  return (
    <Stack gap={4}>
      <Card border radius={2} overflow="hidden">
        {toggles.map((m, i) => {
          const type = m.field.schemaType;
          const on = (m.field.value ?? type.initialValue) === true;
          return (
            <Card key={m.key} as="label" padding={3} borderTop={i > 0} tone={on ? "positive" : "default"} style={{ cursor: "pointer", display: "block" }}>
              <Flex gap={3} align="center">
                <Switch checked={on} readOnly={m.field.readOnly} onChange={() => onChange([setIfMissing({}), set(!on, [m.name])])} />
                <Stack gap={2} flex={1}>
                  <Text size={1} weight="medium">
                    {type.title}
                    {type.description ? <Help text={type.description as string} /> : null}
                  </Text>
                </Stack>
              </Flex>
            </Card>
          );
        })}
      </Card>
      {rest.map((m) => (
        <ObjectInputMember key={m.key} member={m} renderAnnotation={props.renderAnnotation} renderBlock={props.renderBlock} renderInlineBlock={props.renderInlineBlock} renderField={props.renderField} renderInput={props.renderInput} renderItem={props.renderItem} renderPreview={props.renderPreview} />
      ))}
    </Stack>
  );
}
