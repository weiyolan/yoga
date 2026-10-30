/**
 * The “we got it” mail to whoever sent a form (contact form, a class request, a review): Studio → Mails →
 * Bevestiging bericht / les-aanvraag / review (`receiptMail`, one per kind), else the built-in text
 * (lib/dictionary.ts → receipt). Shared by the site (app/actions/forms.ts, app/api/mail) and the Studio
 * preview. No `@/` imports: the Studio imports this too.
 */
import type { Lang } from "../sanity/site.config";
import { fill } from "./confirmation";
import { getDictionary } from "./dictionary";
import type { MailContent } from "./mail-template";
import { firstName } from "./newsletter";

export const RECEIPT_KINDS = ["contact", "class", "review"] as const;
export type ReceiptKind = (typeof RECEIPT_KINDS)[number];

/** A `receiptMail` resolved to one language (sanity/queries.ts RECEIPT_MAIL_QUERY). */
export type ReceiptMail = {
  subject?: string | null;
  heading?: string | null;
  body?: string | null;
} | null;

/** {naam} (first name), {les} (Yin yoga · Di 19:30 · Studio), {stijl} (Yin yoga), {retreat}. */
export type ReceiptVars = {
  naam: string;
  les?: string;
  stijl?: string;
  retreat?: string;
};

export function receiptContent(
  lang: Lang,
  kind: ReceiptKind,
  mail: ReceiptMail,
  vars: ReceiptVars,
  rows: [string, string][],
  photo?: string | null,
) {
  const t = getDictionary(lang).receipt;
  const v = {
    naam: firstName(vars.naam),
    les: vars.les ?? "",
    stijl: vars.stijl ?? vars.les ?? "",
    retreat: vars.retreat ?? "",
  };
  const clean = (s: string) => fill(s, v).replace(/ ,/g, ",");
  const def = {
    subject: t[`${kind}Subject`],
    heading: t[`${kind}Heading`],
    body: t[`${kind}Body`],
  };
  const content: MailContent = {
    heading: clean(mail?.heading || def.heading),
    text: clean(mail?.body || def.body),
    rows: rows.filter(([, x]) => x),
    photo,
  };
  return { subject: clean(mail?.subject || def.subject), content };
}

/** Example values for the Studio preview / test mail. */
export function receiptExample(lang: Lang, kind: ReceiptKind) {
  const t = getDictionary(lang).receipt;
  const en = lang === "en";
  const les = en
    ? "Yin yoga · Tue 19:30 · Studio Zen"
    : "Yin yoga · Di 19:30 · Studio Zen";
  const vars: ReceiptVars = {
    naam: "Anna",
    les,
    stijl: "Yin yoga",
    retreat: "Dahab: Yoga & Freediving",
  };
  const rows: Record<ReceiptKind, [string, string][]> = {
    contact: [
      [t.subject, "Retreats"],
      [
        t.yours,
        en
          ? "Hi! Is there still a spot in Dahab?"
          : "Hoi! Is er nog plaats in Dahab?",
      ],
    ],
    class: [
      [t.lesson, les],
      [t.wish, t.wishes.trial],
    ],
    review: [
      [t.retreat, vars.retreat!],
      [t.score, "★★★★★"],
      [
        t.yours,
        en
          ? "A wonderful week, thank you!"
          : "Een heerlijke week, dank jullie!",
      ],
    ],
  };
  return { vars, rows: rows[kind] };
}
