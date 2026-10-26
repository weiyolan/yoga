/**
 * Sign-up form rules shared by the browser (components/Forms.tsx) and the server (app/actions/forms.ts):
 * which questions show (“Enkel tonen als de vraag ervoor … is”) and what an answer reads as.
 * No `@/` imports.
 */

export type FormQuestion = {
  _key: string;
  label: string | null;
  help: string | null;
  type: string | null;
  options: string[] | null;
  optionsNl?: string[] | null;
  other?: boolean | null;
  required: boolean | null;
  showIf?: string | null;
};

/** Field name of a question's answer (`q.<key>`), and of its “Andere: …” text. */
export const qName = (q: { _key: string }) => `q.${q._key}`;
export const otherName = (q: { _key: string }) => `q.${q._key}.other`;

/** Room and diet keep their own fields (`room`, `diet`) also when placed as a question. */
export const fieldName = (q: FormQuestion) => (q.type === "room" ? "room" : q.type === "diet" ? "diet" : qName(q));

const norm = (s: string) => s.trim().toLowerCase();

/** Does the raw value of `prev` match one of the lines of `showIf` (Dutch option texts, “Ja” / “Nee”, “Andere”)? */
function matches(prev: FormQuestion, raw: string, showIf: string) {
  const wanted = showIf.split("\n").map(norm).filter(Boolean);
  if (!wanted.length) return true;
  if (!raw) return false;
  if (prev.type === "yesno") return wanted.some((w) => (raw === "yes" ? ["ja", "yes"] : ["nee", "no"]).includes(w));
  if (prev.type === "choice") {
    if (raw === "other") return wanted.some((w) => ["andere", "anders", "other"].includes(w));
    const i = Number(raw);
    const texts = [(prev.optionsNl ?? []).filter(Boolean)[i], (prev.options ?? []).filter(Boolean)[i]].filter(Boolean).map((x) => norm(x!));
    return wanted.some((w) => texts.includes(w));
  }
  return wanted.some((w) => norm(raw).startsWith(w));
}

/** Keys of the questions that show, given the current values (`get(fieldName)`). A question after a hidden one with a condition on it is hidden too. */
export function visibleKeys(questions: FormQuestion[], get: (name: string) => string) {
  const shown = new Set<string>();
  let prev: FormQuestion | null = null;
  for (const q of questions) {
    if (q.type === "section") {
      shown.add(q._key);
      continue;
    }
    const ok = !q.showIf?.trim() || (!!prev && shown.has(prev._key) && matches(prev, get(fieldName(prev)), q.showIf));
    if (ok) shown.add(q._key);
    prev = q;
  }
  return shown;
}

/** What an answer reads as (choice → the option text in that language, yes/no → Ja / Nee, “Andere” → “Andere: <text>”). */
export function answerText(q: FormQuestion, raw: string, otherText: string, words: { yes: string; no: string; other: string }, options = q.options) {
  if (q.type === "yesno") return raw === "yes" ? words.yes : raw === "no" ? words.no : "";
  if (q.type === "choice") {
    if (raw === "other") return otherText ? `${words.other}: ${otherText}` : words.other;
    return raw && /^\d+$/.test(raw) ? ((options ?? []).filter(Boolean)[Number(raw)] ?? "") : "";
  }
  return raw;
}

/** The form split into steps: a step per “Nieuwe stap”, questions before the first one in a first step. */
export function questionSteps(questions: FormQuestion[]) {
  const steps: { key: string; title: string | null; help: string | null; questions: FormQuestion[] }[] = [];
  for (const q of questions) {
    if (q.type === "section") steps.push({ key: q._key, title: q.label, help: q.help, questions: [] });
    else {
      if (!steps.length) steps.push({ key: "questions", title: null, help: null, questions: [] });
      steps[steps.length - 1].questions.push(q);
    }
  }
  return steps;
}
