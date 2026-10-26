import { AddIcon } from "@sanity/icons/Add";
import { SparklesIcon } from "@sanity/icons/Sparkles";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { randomKey } from "@sanity/util/content";
import { createContext, useContext, useState, type MouseEvent, type ReactNode } from "react";
import { insert, set, setIfMissing, useClient, type ArrayOfObjectsInputProps, type FieldProps, type InputProps, type ItemProps } from "sanity";
import { apiVersion, defaultLanguage, languages } from "../../sanity/site.config";
import { findJobs, translatedValue, translateJobs } from "../lib/ai";

/**
 * NL | EN tabs (small, after the field title) on every localized field (sanity-plugin-internationalized-array): one language at a
 * time, so short and long texts take half the space. The other languages are only hidden
 * (`display: none` on their array item), never left out of `members`: leaving them out broke
 * alt texts and the add/translate actions before (plan S15). A dot on a tab = still empty; red/amber =
 * a validation error/warning in that language. “Vertaal” fills the English of this one field.
 */
type Item = { _key: string; _type: string; language?: string; value?: unknown };
type Node = { validation?: { level: string }[]; members?: { kind: string; field?: Node; item?: Node }[] };

type Active = { active: string; setActive: (lang: string) => void };
const ActiveLanguage = createContext<Active | null>(null);
const isArray = (name: string) => name.startsWith("internationalizedArray") && !name.endsWith("Value");
const isItem = (name: string) => name.startsWith("internationalizedArray") && name.endsWith("Value");
const filled = (v: unknown) => (typeof v === "string" ? v.trim().length > 0 : Array.isArray(v) && v.length > 0);
const issues = (n?: Node): string[] => [...(n?.validation ?? []).map((v) => v.level), ...(n?.members ?? []).flatMap((m) => issues(m.field ?? m.item))];

/** form.components.field: the tabs, small, right after the field title; holds the active language. */
export function I18nTabsField(props: FieldProps) {
  if (!isArray(props.schemaType.name)) return props.renderDefault(props);
  return <TabsField {...props} />;
}

/** form.components.input: the plugin's own input + an “add” button when the active language has no item yet. */
export function I18nTabsInput(props: InputProps) {
  const ctx = useContext(ActiveLanguage);
  if (!ctx || !isArray(props.schemaType.name)) return props.renderDefault(props);
  return <TabsInput {...(props as ArrayOfObjectsInputProps)} active={ctx.active} />;
}

/** form.components.item: hides the items of the other languages. */
export function I18nTabsItem(props: ItemProps) {
  const active = useContext(ActiveLanguage)?.active;
  const lang = (props.value as Item | undefined)?.language;
  if (!active || !isItem(props.schemaType.name) || !lang) return props.renderDefault(props);
  return (
    <div className="i18n-tab-item" style={lang === active ? undefined : { display: "none" }}>
      {props.renderDefault(props)}
    </div>
  );
}

/** The plugin's “NEDERLANDS” / “ENGLISH” header above each input: the tab already says it. */
const CSS = `.i18n-tab-item [data-ui="Flex"]:has(> [data-ui="fieldHeaderContentBox"] label[for$=".value"]) { display: none; }`;

function TabsField(props: FieldProps) {
  const [active, setActive] = useState<string>(defaultLanguage);
  const [busy, setBusy] = useState(false);
  const client = useClient({ apiVersion });
  const toast = useToast();
  const input = (props as FieldProps & { inputProps: ArrayOfObjectsInputProps }).inputProps;
  const value = (props.value as Item[] | undefined) ?? [];
  const itemOf = (lang: string) => value.find((i) => i.language === lang);
  const memberOf = (lang: string) => input.members.find((m) => m.kind === "item" && (m.item.value as Item | undefined)?.language === lang);
  const readOnly = !!input.readOnly;
  const canTranslate = filled(itemOf(defaultLanguage)?.value) && languages.length > 1;

  const translate = async () => {
    const to = active === defaultLanguage ? languages.find((l) => l.id !== defaultLanguage)!.id : active;
    const jobs = findJobs({ field: value }, defaultLanguage, to, true);
    if (!jobs.length) return;
    setBusy(true);
    try {
      const [out] = await translateJobs(client, jobs, defaultLanguage, to);
      const job = jobs[0];
      const v = translatedValue(job, out);
      input.onChange(
        job.en ? set(v, [{ _key: job.en._key }, "value"]) : [setIfMissing([]), insert([{ _key: randomKey(12), _type: job.nl._type, language: to, value: v }], "after", [{ _key: job.nl._key }])],
      );
      setActive(to);
    } catch (err) {
      toast.push({ status: "error", title: "Vertalen niet gelukt", description: String(err instanceof Error ? err.message : err) });
    } finally {
      setBusy(false);
    }
  };

  // clicks in the header must not reach the field's <label>/<legend>
  const click = (fn: () => void) => (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  const tab = (id: string): ReactNode => {
    const levels = issues(memberOf(id)?.kind === "item" ? (memberOf(id) as { item: Node }).item : undefined);
    const tone = levels.includes("error") ? "critical" : levels.includes("warning") ? "caution" : undefined;
    const empty = !filled(itemOf(id)?.value);
    const label = id.toUpperCase();
    return (
      <Button
        key={id}
        as="span"
        role="tab"
        aria-selected={active === id}
        mode={active === id ? "default" : "bleed"}
        tone={tone ?? (active === id ? "primary" : "default")}
        paddingX={2}
        paddingY={1}
        fontSize={0}
        radius={2}
        text={`${label}${empty ? " •" : ""}`}
        title={empty ? `${label}: nog leeg` : label}
        onClick={click(() => setActive(id))}
      />
    );
  };

  const title = (
    <Flex as="span" align="center" gap={2} wrap="wrap" style={{ display: "inline-flex" }}>
      <span>{props.title}</span>
      <Card as="span" radius={2} padding={0} tone="transparent" border style={{ display: "inline-flex" }}>
        <Flex as="span" role="tablist" gap={0}>
          {languages.map((l) => tab(l.id))}
        </Flex>
      </Card>
      {canTranslate ? (
        <Button
          as="span"
          mode="bleed"
          paddingX={2}
          paddingY={1}
          fontSize={0}
          icon={SparklesIcon}
          text={busy ? "Bezig…" : undefined}
          title="Vertaal: vul het Engels van dit veld in met een AI-vertaling van het Nederlands (overschrijft)."
          aria-label="Vertaal dit veld"
          aria-disabled={busy || readOnly}
          style={busy || readOnly ? { opacity: 0.5, pointerEvents: "none" } : undefined}
          onClick={click(() => void translate())}
        />
      ) : null}
    </Flex>
  );

  return (
    <ActiveLanguage.Provider value={{ active, setActive }}>
      <style>{CSS}</style>
      {props.renderDefault({ ...props, title: title as unknown as string })}
    </ActiveLanguage.Provider>
  );
}

function TabsInput(props: ArrayOfObjectsInputProps & { active: string }) {
  const { active } = props;
  const value = (props.value as Item[] | undefined) ?? [];
  const add = (lang: string) => props.onChange([setIfMissing([]), insert([{ _key: randomKey(12), _type: `${props.schemaType.name}Value`, language: lang }], "after", [-1])]);
  if (value.some((i) => i.language === active) || props.readOnly) return props.renderDefault(props);
  return (
    // one element: the form's grid puts 32px between its children
    <Stack gap={2}>
      {props.renderDefault(props)}
      <Card padding={3} radius={2} border tone="transparent">
        <Flex align="center" gap={3}>
          <Box flex={1}>
            <Text size={1} muted>
              {active === defaultLanguage ? "Nog geen Nederlandse tekst." : "Nog geen Engelse tekst: leeg = de Nederlandse tekst op de site."}
            </Text>
          </Box>
          <Button mode="ghost" padding={2} fontSize={1} icon={AddIcon} text={`${active.toUpperCase()} toevoegen`} onClick={() => add(active)} />
        </Flex>
      </Card>
    </Stack>
  );
}
