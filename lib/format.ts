import { getDictionary } from "@/lib/dictionary";
import type { Lang } from "@/sanity/site.config";

const locale: Record<Lang, string> = { nl: "nl-BE", en: "en-GB" };
const parse = (d: string) => new Date(`${d}T12:00:00Z`);
const part = (lang: Lang, d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale[lang], { timeZone: "UTC", ...o }).format(d).replace(".", "");

/** "9–16 mei 2027", "28 feb – 3 mrt 2027", "29 dec 2026 – 3 jan 2027"; `year: false` drops the year. */
export function dateRange(lang: Lang, start?: string | null, end?: string | null, year = true) {
  if (!start) return "";
  const a = parse(start);
  const b = end ? parse(end) : a;
  const y = year ? ` ${b.getUTCFullYear()}` : "";
  const day = (d: Date) => d.getUTCDate();
  const mon = (d: Date) => part(lang, d, { month: "short" });
  if (a.getTime() === b.getTime()) return `${day(a)} ${mon(a)}${y}`;
  if (a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear()) return `${day(a)}–${day(b)} ${mon(b)}${y}`;
  const ay = year && a.getUTCFullYear() !== b.getUTCFullYear() ? ` ${a.getUTCFullYear()}` : "";
  return `${day(a)} ${mon(a)}${ay} – ${day(b)} ${mon(b)}${y}`;
}

/** "mei 2026" (filter options). */
export const monthYear = (lang: Lang, d: string) => part(lang, parse(d), { month: "long", year: "numeric" });

/** "€ 1.120" */
export const euro = (lang: Lang, n?: number | null) =>
  n == null ? "" : new Intl.NumberFormat(locale[lang], { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

/** "Eifel 2025", "Dahab, Egypte" */
export const join = (...xs: (string | null | undefined | false)[]) => xs.filter(Boolean).join(", ");

export const htmlLang = (lang: Lang) => locale[lang];

/** Lightbox / gallery caption: "Kampvuur · Eifel, nov 2025 · Foto: Jane Doe". */
export const photoCaption = (lang: Lang, m: { title?: string | null; credit?: string | null }, ...extra: (string | null | undefined)[]) =>
  [m.title, ...extra, m.credit ? `${lang === "en" ? "Photo" : "Foto"}: ${m.credit}` : null].filter(Boolean).join(" · ");

/** Free places on a retreat (`capacity - booked`), or null when there's no capacity set. */
export const spotsLeft = (r: { capacity?: number | null; booked?: number | null }) => (r.capacity ? Math.max(r.capacity - (r.booked ?? 0), 0) : null);

/** "max. 12 (deelnemers)" until the first confirmed sign-up, then "nog 3 plaatsen" / "volzet". */
export function placesLabel(lang: Lang, r: { capacity?: number | null; booked?: number | null }, withWord = false) {
  const t = getDictionary(lang).card;
  const left = spotsLeft(r);
  if (left === null) return null;
  if (r.booked) return left ? t.spotsLeft(left) : t.full;
  return withWord ? `${t.max} ${r.capacity} ${t.participants}` : `${t.max} ${r.capacity}`;
}
