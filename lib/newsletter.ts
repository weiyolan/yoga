/**
 * The confirmation mail after signing up for the newsletter (Studio → Mails → Nieuwsbrief bevestiging,
 * else the built-in text), with an unsubscribe link at the bottom. Shared by the site
 * (app/actions/forms.ts) and the Studio preview. No `@/` imports: the Studio imports this too.
 */
import type { Lang } from "../sanity/site.config";
import { getDictionary } from "./dictionary";
import { fill } from "./confirmation";
import type { MailContent } from "./mail-template";

/** `newsletterMail` resolved to one language (sanity/queries.ts NEWSLETTER_MAIL_QUERY). */
export type NewsletterMail = { subject?: string | null; body?: string | null } | null;

/** “Anna Peeters” → “Anna” (newsletters greet by first name). */
export const firstName = (name?: string | null) => name?.trim().split(/\s+/)[0] ?? "";

/** `{naam}` → their first name (empty if they only gave an e-mail address); the unsubscribe link goes in the small footer. */
export function newsletterContent(lang: Lang, mail: NewsletterMail, name: string | undefined, unsubscribeUrl: string | null) {
  const t = getDictionary(lang).footer;
  const vars = { naam: firstName(name) };
  const clean = (s: string) => fill(s, vars).replace(/ ,/g, ",").replace(/,\s*(?=[?!.])/g, "");
  const body = mail?.body ? clean(mail.body) : t.mailBody(vars.naam);
  const content: MailContent = { text: body, unsubscribe: unsubscribeUrl ? { label: t.unsubscribeLink, url: unsubscribeUrl } : null };
  return { subject: mail?.subject ? clean(mail.subject) : t.mailSubject, content };
}
