import { AddIcon } from "@sanity/icons/Add";
import { SparklesIcon } from "@sanity/icons/Sparkles";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { randomKey } from "@sanity/util/content";
import { createContext, useContext, useState, type ReactNode } from "react";
import { insert, set, setIfMissing, useClient, type ArrayOfObjectsInputProps, type InputProps, type ItemProps } from "sanity";
import { apiVersion, defaultLanguage, languages } from "../../sanity/site.config";
import { findJobs, translatedValue, translateJobs } from "../lib/ai";

/**
 * NL | EN tabs on every localized field (sanity-plugin-internationalized-array): one language at a
 * time, so short and long texts take half the space. The other languages are only hidden
 * (`display: none` on their array item), never left out of `members`: leaving them out broke
 * alt texts and the add/translate actions before (plan S15). A dot on a tab = still empty; red/amber =
 * a validation error/warning in that language. “Vertaal” fills the English of this one field.
 */
type Item = { _key: string; _type: string; language?: string; value?: unknown };
type Node = { validation?: { level: string }[]; members?: { kind: string; field?: Node; item?: Node }[] };

const ActiveLanguage = createContext<string | null>(null);
const isArray = (name: string) => name.startsWith("internationalizedArray") && !name.endsWith("Value");
const isItem = (name: string) => name.startsWith("internationalizedArray") && name.endsWith("Value");
const filled = (v: unknown) => (typeof v === "string" ? v.trim().length > 0 : Array.isArray(v) && v.length > 0);
const issues = (n?: Node): string[] => [...(n?.validation ?? []).map((v) => v.level), ...(n?.members ?? []).flatMap((m) => issues(m.field ?? m.item))];

/** form.components.input: tabs around the plugin's own input. */
export function I18nTabsInput(props: InputProps) {
  if (!isArray(props.schemaType.name)) return props.renderDefault(props);
  return <Tabs {...(props as ArrayOfObjectsInputProps)} />;
}

/** form.components.item: hides the items of the other languages. */
export function I18nTabsItem(props: ItemProps) {
  const active = useContext(ActiveLanguage);
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

function Tabs(props: ArrayOfObjectsInputProps) {
  const [active, setActive] = useState<string>(defaultLanguage);
  const [busy, setBusy] = useState(false);
  const client = useClient({ apiVersion });
  const toast = useToast();
  const value = (props.value as Item[] | undefined) ?? [];
  const itemOf = (lang: string) => value.find((i) => i.language === lang);
  const memberOf = (lang: string) => props.members.find((m) => m.kind === "item" && (m.item.value as Item | undefined)?.language === lang);
  const readOnly = !!props.readOnly;
  const nl = itemOf(defaultLanguage);
  const canTranslate = filled(nl?.value) && languages.length > 1;

  const add = (lang: string) => props.onChange([setIfMissing([]), insert([{ _key: randomKey(12), _type: `${props.schemaType.name}Value`, language: lang }], "after", [-1])]);

  const translate = async () => {
    const to = active === defaultLanguage ? languages.find((l) => l.id !== defaultLanguage)!.id : active;
    const jobs = findJobs({ field: value }, defaultLanguage, to, true);
    if (!jobs.length) return;
    setBusy(true);
    try {
      const [out] = await translateJobs(client, jobs, defaultLanguage, to);
      const job = jobs[0];
      const v = translatedValue(job, out);
      props.onChange(
        job.en ? set(v, [{ _key: job.en._key }, "value"]) : [setIfMissing([]), insert([{ _key: randomKey(12), _type: job.nl._type, language: to, value: v }], "after", [{ _key: job.nl._key }])],
      );
      setActive(to);
    } catch (err) {
      toast.push({ status: "error", title: "Vertalen niet gelukt", description: String(err instanceof Error ? err.message : err) });
    } finally {
      setBusy(false);
    }
  };

  const tab = (id: string, label: string): ReactNode => {
    const levels = issues(memberOf(id)?.kind === "item" ? (memberOf(id) as { item: Node }).item : undefined);
    const tone = levels.includes("error") ? "critical" : levels.includes("warning") ? "caution" : undefined;
    const empty = !filled(itemOf(id)?.value);
    return (
      <Button
        key={id}
        mode={active === id ? "default" : "bleed"}
        tone={tone ?? (active === id ? "primary" : "default")}
        padding={2}
        fontSize={1}
        text={`${label}${empty ? " •" : ""}`}
        title={empty ? `${label}: nog leeg` : label}
        onClick={() => setActive(id)}
      />
    );
  };

  return (
    <ActiveLanguage.Provider value={active}>
      {/* one element: the form's grid puts 32px between its children */}
      <Stack gap={2}>
        <style>{CSS}</style>
        <Flex align="center" gap={1}>
          <Card radius={2} padding={1} tone="transparent" border>
            <Flex gap={1}>{languages.map((l) => tab(l.id, l.id.toUpperCase()))}</Flex>
          </Card>
          <Box flex={1} />
          {canTranslate ? (
            <Button
              mode="bleed"
              padding={2}
              fontSize={1}
              icon={SparklesIcon}
              text={busy ? "Bezig…" : "Vertaal"}
              title="Vul het Engels van dit veld in met een AI-vertaling van het Nederlands (overschrijft)."
              disabled={busy || readOnly}
              onClick={translate}
            />
          ) : null}
        </Flex>
        {props.renderDefault(props)}
        {!itemOf(active) && !readOnly ? (
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
        ) : null}
      </Stack>
    </ActiveLanguage.Provider>
  );
}
