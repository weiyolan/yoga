/**
 * A newsletter (Studio → Contact → Nieuwsbrieven) as an HTML mail: header photo, title, rich text,
 * optional button and retreat cards, unsubscribe link at the bottom. Shared by the site (sending,
 * app/api/mail) and the Studio preview. No `@/` imports: the Studio imports this too.
 */
import type { Lang } from "../sanity/site.config";
import { getDictionary } from "./dictionary";
import { fill } from "./confirmation";
import { dateRange } from "./format";
import { blocksText, type MailBlock, type MailContent } from "./mail-template";
import { retreatHref, translatePath } from "./routes";

const t = (f: string) => `coalesce(${f}[language == $lang][0].value, ${f}[language == "nl"][0].value)`;

/** One newsletter in one language. `$id` (published id; with the drafts perspective: the draft), `$lang`. */
export const NEWSLETTER_ISSUE_QUERY = `*[_id == $id][0]{
  _id, title, audience, sentAt, sentCount,
  "subject": ${t("subject")},
  "heading": ${t("heading")},
  "image": image->image.asset->url,
  "body": ${t("body")},
  "button": { "label": ${t("buttonLabel")}, "url": buttonUrl },
  "retreats": retreats[]->{ "title": ${t("title")}, "country": ${t("country")}, startDate, endDate, "slug": slug.current, "photo": cardPhoto->image.asset->url }
}`;

export type NewsletterIssue = {
  _id: string;
  title?: string | null;
  audience?: string[] | null;
  sentAt?: string | null;
  sentCount?: number | null;
  subject?: string | null;
  heading?: string | null;
  image?: string | null;
  body?: MailBlock[] | null;
  button?: { label?: string | null; url?: string | null } | null;
  retreats?: { title?: string | null; country?: string | null; startDate?: string | null; endDate?: string | null; slug?: string | null; photo?: string | null }[] | null;
} | null;

/** `{naam}` in the text → the name (empty if they only gave an e-mail address). `site`: e.g. https://yogazentonic.com */
export function newsletterIssueContent(lang: Lang, issue: NewsletterIssue, name: string | undefined, unsubscribeUrl: string | null, site: string) {
  const vars = { naam: name ?? "" };
  // empty name: “Dag {naam},” → “Dag,”, “ga je mee, {naam}?” → “ga je mee?”
  const f = (s: string) => fill(s, vars).replace(/ ,/g, ",").replace(/,\s*(?=[?!.])/g, "");
  const blocks = issue?.body ?? [];
  // a path on the site (“/retreats”) → that page in their language
  const url = issue?.button?.url?.startsWith("/") ? `${site}${translatePath(issue.button.url, lang)}` : issue?.button?.url;
  const button = issue?.button?.label && url ? { label: issue.button.label, url } : null;
  const content: MailContent = {
    heading: issue?.heading ?? undefined,
    photo: issue?.image,
    text: blocks.length ? blocksText(blocks, f) : "",
    blocks,
    fill: f,
    button,
    cards: (issue?.retreats ?? [])
      .filter((r) => r?.title && r.slug)
      .map((r) => ({ title: r.title!, meta: [dateRange(lang, r.startDate, r.endDate), r.country].filter(Boolean).join(" · "), url: `${site}${retreatHref(lang, r.slug)}`, photo: r.photo, more: lang === "en" ? "More info" : "Meer info" })),
    unsubscribe: unsubscribeUrl ? { label: getDictionary(lang).footer.unsubscribeLink, url: unsubscribeUrl } : null,
  };
  return { subject: issue?.subject ? f(issue.subject) : (issue?.title ?? "Yoga, Zen & Tonic"), content };
}
