/**
 * Feedback form rules (Studio → Formulieren → Feedbackformulieren), shared by the browser
 * (components/FeedbackForm.tsx), the server (app/actions/forms.ts) and the Studio (results view).
 * Builds on the sign-up form rules (lib/signup-form.ts: “Enkel tonen als …”, choice texts). No `@/` imports.
 */
import { answerText, otherName, qName, visibleKeys, type FormQuestion } from "./signup-form";

/**
 * A feedback question. On top of the sign-up types: `grid` (rows × columns, one answer per row),
 * `scale` (1…max with a word at both ends), `stars` (1…max stars), `quote` (the testimonial text),
 * `publish` (how the quote may be shown: with first name / anonymous / not), `name`, `email`.
 */
export type ReviewQuestion = FormQuestion;

export type ReviewFormDef = {
  _id: string;
  name: string | null;
  title: string | null;
  intro: string | null;
  questions: ReviewQuestion[] | null;
} | null;

/** The meaning of the 3 options of a `publish` question, in this order. */
export const PUBLISH = ["name", "anonymous", "private"] as const;
export type Publish = (typeof PUBLISH)[number];

export const PUBLISH_DEFAULT = {
  nl: ["Met mijn voornaam", "Anoniem (bv. “Deelnemer {retreat}”)", "Liever niet publiceren, deze feedback is alleen voor jullie"],
  en: ["With my first name", "Anonymously (e.g. “Participant {retreat}”)", "Rather not, this feedback is just for you"],
};

/**
 * Right after fetching (browser and server): a `publish` question without its own 3 options gets the
 * default texts, and `{retreat}` in its options becomes the retreat's name.
 */
export function withDefaults<Q extends ReviewQuestion>(questions: Q[] | null | undefined, lang: "nl" | "en", retreat = ""): Q[] {
  const fill = (o: string[]) => o.map((x) => x.replace(/\{retreat\}/g, retreat).replace(/\s+/g, " ").trim());
  return (questions ?? []).map((q) => {
    if (q.type !== "publish") return q;
    const own = list(q.options).length === 3;
    return { ...q, options: fill(own ? list(q.options) : PUBLISH_DEFAULT[lang]), // optionsNl stays as typed in the Studio: “Enkel tonen als …” compares with those texts
    optionsNl: own && list(q.optionsNl).length === 3 ? list(q.optionsNl) : PUBLISH_DEFAULT.nl };
  });
}

/** Field name of one row of a grid question. */
export const rowName = (q: { _key: string }, i: number) => `q.${q._key}.r${i}`;

const list = (v?: string[] | null) => (v ?? []).filter(Boolean);
export const optionsOf = (q: ReviewQuestion) => list(q.options);
export const rowsOf = (q: ReviewQuestion) => list(q.rows);
/** 1…max (scale: 2–10, default 5; stars: 3–10, default 5). */
export const maxOf = (q: ReviewQuestion) => Math.min(10, Math.max(q.type === "stars" ? 3 : 2, Math.round(q.scaleMax ?? 5)));

/** Types whose answer is one radio value (index / number). */
const ONE = new Set(["yesno", "choice", "scale", "stars", "publish"]);

/** One stored answer: Dutch texts for Rita & Philippe, the raw value for the results (language-independent). */
export type ReviewAnswer = { qKey: string; type: string; question: string; row?: string; rowIndex?: number; answer: string; value?: number };

export type ParsedReview = {
  ok: boolean;
  answers: ReviewAnswer[];
  name: string;
  email: string;
  quote: string;
  /** The first stars question, out of 5 (for the testimonial). */
  rating: number | null;
  publish: Publish | null;
};

const words = { nl: { yes: "Ja", no: "Nee", other: "Andere" }, en: { yes: "Yes", no: "No", other: "Other" } };

/**
 * Reads a submitted feedback form: the questions that show (“Enkel tonen als …”), required ones answered
 * (a grid: every row), answers as Dutch text (`nl`: the same form in Dutch, for the labels) + raw values.
 */
export function parseReview(questions: ReviewQuestion[], nl: ReviewQuestion[] | null | undefined, get: (name: string) => string, getAll: (name: string) => string[]): ParsedReview {
  const all = questions.filter((q) => q.label);
  const shown = visibleKeys(all, get);
  const out: ParsedReview = { ok: true, answers: [], name: "", email: "", quote: "", rating: null, publish: null };
  for (const q of all) {
    if (q.type === "section" || !shown.has(q._key)) continue;
    const n = nl?.find((x) => x._key === q._key);
    const label = n?.label || q.label || "";
    const t = q.type ?? "text";
    if (t === "grid") {
      const rows = rowsOf(q);
      const rowsNl = n ? rowsOf(n) : rows;
      const cols = optionsOf(n ?? q);
      rows.forEach((row, i) => {
        const raw = get(rowName(q, i));
        const v = /^\d+$/.test(raw) && Number(raw) < cols.length ? Number(raw) : null;
        if (v === null) {
          if (q.required) out.ok = false;
          return;
        }
        out.answers.push({ qKey: q._key, type: t, question: label, row: rowsNl[i] ?? row, rowIndex: i, answer: cols[v] ?? "", value: v });
      });
      continue;
    }
    if (t === "multi") {
      const raw = getAll(qName(q)).filter((x) => /^(\d+|other)$/.test(x)).join(",");
      if (!raw) {
        if (q.required) out.ok = false;
        continue;
      }
      out.answers.push({ qKey: q._key, type: t, question: label, answer: answerText(q, raw, get(otherName(q)).slice(0, 500), words.nl, optionsOf(n ?? q)) });
      continue;
    }
    const raw = get(qName(q)).slice(0, t === "quote" || t === "textarea" ? 2000 : 300).trim();
    if (!raw) {
      if (q.required) out.ok = false;
      continue;
    }
    if (ONE.has(t)) {
      let value: number | undefined;
      let answer = "";
      if (t === "scale" || t === "stars") {
        const v = Number(raw);
        if (!Number.isInteger(v) || v < 1 || v > maxOf(q)) {
          if (q.required) out.ok = false;
          continue;
        }
        value = v;
        answer = t === "stars" ? `${"★".repeat(v)}${"☆".repeat(maxOf(q) - v)} (${v}/${maxOf(q)})` : `${v} / ${maxOf(q)}`;
        if (t === "stars" && out.rating === null) out.rating = Math.max(1, Math.min(5, Math.round((v / maxOf(q)) * 5)));
      } else if (t === "publish") {
        const i = Number(raw);
        if (!(i >= 0 && i < 3)) continue;
        value = i;
        answer = optionsOf(n ?? q)[i] ?? "";
        out.publish = PUBLISH[i];
      } else {
        answer = answerText(q, raw, get(otherName(q)).slice(0, 500), words.nl, optionsOf(n ?? q));
        if (/^\d+$/.test(raw)) value = Number(raw);
      }
      out.answers.push({ qKey: q._key, type: t, question: label, answer, value });
      continue;
    }
    if (t === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        out.ok = false;
        continue;
      }
      out.email = raw.slice(0, 200);
    }
    if (t === "name") out.name = raw.slice(0, 100);
    if (t === "quote") out.quote = raw.slice(0, 1200);
    out.answers.push({ qKey: q._key, type: t, question: label, answer: raw });
  }
  return out;
}

/** Shown on the testimonial: their name, “Deelnemer <retreat>” when anonymous. */
export const publicName = (p: Pick<ParsedReview, "name" | "publish">, retreat: string, lang: "nl" | "en") =>
  p.publish === "anonymous" || !p.name ? `${lang === "en" ? "Participant" : "Deelnemer"} ${retreat}` : p.name;

/**
 * What one question's answer reads as, one part per grid row (`row`), in the language of `options` / `rows`
 * (the sign-up form calls it twice: the participant's language for their mail, Dutch to store). `get`
 * returns a field's value (several ticks of a “Meerdere keuzes” joined with “,”, like formValues()).
 * Empty = not answered (a grid: only the answered rows).
 */
export function answerParts(
  q: ReviewQuestion,
  get: (name: string) => string,
  words: { yes: string; no: string; other: string },
  options = q.options,
  rows = q.rows,
): { row?: string; answer: string }[] {
  const opts = list(options);
  if (q.type === "grid")
    return list(rows).flatMap((row, i) => {
      const raw = get(rowName(q, i));
      return /^\d+$/.test(raw) && opts[Number(raw)] ? [{ row, answer: opts[Number(raw)] }] : [];
    });
  const raw = get(qName(q)).trim();
  if (!raw) return [];
  if (q.type === "scale" || q.type === "stars") {
    const v = Number(raw);
    if (!Number.isInteger(v) || v < 1 || v > maxOf(q)) return [];
    return [{ answer: q.type === "stars" ? `${"★".repeat(v)}${"☆".repeat(maxOf(q) - v)} (${v}/${maxOf(q)})` : `${v} / ${maxOf(q)}` }];
  }
  const text = answerText(q, raw, get(otherName(q)).trim().slice(0, 500), words, options);
  return text ? [{ answer: text }] : [];
}

/** Is a required question answered (a grid: every row)? */
export const answered = (q: ReviewQuestion, get: (name: string) => string) =>
  q.type === "grid" ? list(q.rows).every((_, i) => /^\d+$/.test(get(rowName(q, i)))) : !!get(qName(q)).trim();
