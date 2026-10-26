/**
 * The confirmation mail after signing up for the newsletter (Studio → Mails → Nieuwsbrief-bevestiging,
 * else the built-in text), with an unsubscribe link at the bottom. Shared by the site
 * (app/actions/forms.ts) and the Studio preview. No `@/` imports: the Studio imports this too.
 */
import type { Lang } from "../sanity/site.config";
import { getDictionary } from "./dictionary";
import { fill } from "./confirmation";
import type { MailContent } from "./mail-template";

/** `newsletterMail` resolved to one language (sanity/queries.ts NEWSLETTER_MAIL_QUERY). */
export type NewsletterMail = { subject?: string | null; body?: string | null } | null;

/** `{naam}` (empty if they only gave an e-mail address). */
export function newsletterContent(lang: Lang, mail: NewsletterMail, name: string | undefined, unsubscribeUrl: string | null) {
  const t = getDictionary(lang).footer;
  const vars = { naam: name ?? "" };
  const body = mail?.body ? fill(mail.body, vars).replace(/ ,/g, ",") : t.mailBody;
  const content: MailContent = { text: [body, unsubscribeUrl ? t.unsubscribe(unsubscribeUrl) : ""].filter(Boolean).join("\n\n") };
  return { subject: mail?.subject ? fill(mail.subject, vars) : t.mailSubject, content };
}
