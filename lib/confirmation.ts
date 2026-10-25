/**
 * The confirmation mail to a participant, from a Studio “Bevestigingsmail” document (or the built-in
 * text when there is none). Shared by the website (automatic mail, app/actions/forms.ts) and the
 * Studio (“Bevestigingsmail” on a sign-up: opens it in your own mail app). No `@/` imports: the Studio
 * imports this too.
 */
import type { Lang } from "../sanity/site.config";
import { getDictionary } from "./dictionary";
import { dateRange, euro } from "./format";

/** A `confirmationMail` document, resolved to one language (sanity/queries.ts MAIL). */
export type ConfirmationMail = {
  subject?: string | null;
  body?: string | null;
  payment?: string | null;
  waitlistSubject?: string | null;
  waitlistBody?: string | null;
} | null;

export type ConfirmationRetreat = { title?: string | null; startDate?: string | null; endDate?: string | null; deposit?: number | null };

/** `{naam}`, `{retreat}`, `{datum}`, `{voorschot}` → their values. */
export const fill = (text: string, vars: Record<string, string>) => Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, v), text);

export function confirmation(lang: Lang, mail: ConfirmationMail, retreat: ConfirmationRetreat, name: string, waitlist: boolean) {
  const t = getDictionary(lang).signup;
  const title = retreat.title ?? "retreat";
  const when = dateRange(lang, retreat.startDate, retreat.endDate);
  const vars = { naam: name, retreat: title, datum: when, voorschot: euro(lang, retreat.deposit) };
  const subject = waitlist ? mail?.waitlistSubject : mail?.subject;
  const body = waitlist ? mail?.waitlistBody : mail?.body;
  const payment = !waitlist && retreat.deposit && mail?.payment ? fill(mail.payment, vars) : "";
  return {
    subject: subject ? fill(subject, vars) : waitlist ? t.waitlistMailSubject(title) : t.mailSubject(title),
    text: [body ? fill(body, vars) : waitlist ? t.waitlistMailBody(name, title, when) : t.mailBody(name, title, when), payment].filter(Boolean).join("\n\n"),
  };
}
