import { defineField, type Rule } from "sanity";
import { defaultLanguage, languages } from "../../../sanity/site.config";
import { FoldedI18nInput } from "../../components/FoldedI18nInput";

/** Shape stored by sanity-plugin-internationalized-array (v5). */
type I18nItem = { _key: string; language?: string; value?: unknown };

const defaultTitle = languages.find((l) => l.id === defaultLanguage)?.title ?? defaultLanguage;

function hasText(value: unknown) {
  if (typeof value === "string") return value.trim().length > 0;
  return Array.isArray(value) && value.length > 0; // Portable Text
}

/** The default language (NL) must be filled in; other languages fall back to it. */
export function requireDefault(rule: Rule) {
  return rule.custom((items?: I18nItem[]) =>
    items?.some((i) => i.language === defaultLanguage && hasText(i.value))
      ? true
      : `${defaultTitle} is verplicht`,
  );
}

/** Soft length limit per language (client feedback: "te veel tekst"). */
export function maxChars(rule: Rule, max: number) {
  return rule
    .custom((items?: I18nItem[]) => {
      const long = (items ?? []).filter((i) => typeof i.value === "string" && i.value.length > max);
      return long.length
        ? long.map((i) => ({ message: `Max. ${max} tekens: kort en krachtig houden`, path: [{ _key: i._key }, "value"] }))
        : true;
    })
    .warning();
}

type Opts = {
  title?: string;
  description?: string;
  required?: boolean;
  max?: number;
  group?: string | string[];
  fieldset?: string;
  hidden?: boolean;
};

function i18n(type: string) {
  return (name: string, { required, max, ...opts }: Opts = {}) =>
    defineField({
      name,
      type,
      ...opts,
      components: { input: FoldedI18nInput },
      validation: (rule) => [
        ...(required ? [requireDefault(rule)] : []),
        ...(max ? [maxChars(rule, max)] : []),
      ],
    });
}

/** Localized one-line string. */
export const i18nString = i18n("internationalizedArrayString");
/** Localized plain text (multi-line). */
export const i18nText = i18n("internationalizedArrayText");
/** Localized rich text (paragraphs, bold/italic, links). */
export const i18nBlocks = i18n("internationalizedArraySimpleBlockContent");

/** Localized list: one textarea per language, one item per line. */
export const i18nLines = (name: string, opts: Opts = {}) =>
  i18nText(name, { ...opts, description: [opts.description, "Eén punt per lijn."].filter(Boolean).join(" ") });

/** Default-language value of a localized field, for Studio previews. */
export function pick(items?: I18nItem[]): string | undefined {
  const item = items?.find((i) => i.language === defaultLanguage) ?? items?.[0];
  return typeof item?.value === "string" ? item.value : undefined;
}
