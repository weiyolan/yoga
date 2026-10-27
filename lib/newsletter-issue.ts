/**
 * A newsletter (Studio → Contact → Nieuwsbrieven) as an HTML mail: header photo, title, rich text,
 * then the blocks under it in their order (retreat / lesstijl / own cards, buttons, extra text),
 * unsubscribe link at the bottom. Shared by the site (sending,
 * app/api/mail) and the Studio preview. No `@/` imports: the Studio imports this too.
 */
import type { Lang } from "../sanity/site.config";
import { getDictionary } from "./dictionary";
import { fill } from "./confirmation";
import { firstName } from "./newsletter";
import { dateRange } from "./format";
import { blocksText, type MailBlock, type MailContent, type MailSection } from "./mail-template";
import { href, retreatHref, translatePath } from "./routes";

const t = (f: string) => `coalesce(${f}[language == $lang][0].value, ${f}[language == "nl"][0].value)`;

/** One newsletter in one language. `$id` (published id; with the drafts perspective: the draft), `$lang`. */
export const NEWSLETTER_ISSUE_QUERY = `*[_id == $id][0]{
  _id, title, audience, sentAt, sentCount,
  "subject": ${t("subject")},
  "heading": ${t("heading")},
  "image": image->image.asset->url,
  "body": ${t("body")},
  "button": { "label": ${t("buttonLabel")}, "url": buttonUrl },
  "blocks": blocks[]{
    _key, _type,
    _type == "reference" => @->{ _type, "title": coalesce(${t("title")}, name), "country": ${t("country")}, "tagline": ${t("tagline")}, startDate, endDate, "slug": slug.current, "photo": coalesce(hero.photo, cardPhoto, photo)->image.asset->url },
    _type == "newsletterCard" => { "title": ${t("title")}, "text": ${t("text")}, "more": ${t("more")}, url, "photo": photo->image.asset->url },
    _type == "newsletterButton" => { "label": ${t("label")}, url },
    _type == "newsletterText" => { "body": ${t("body")} }
  },
  // before the blocks: a list of retreats + one button (still read for newsletters made back then)
  "retreats": retreats[]->{ "title": ${t("title")}, "country": ${t("country")}, startDate, endDate, "slug": slug.current, "photo": coalesce(hero.photo, cardPhoto)->image.asset->url }
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
  blocks?: NewsletterBlock[] | null;
  retreats?: { title?: string | null; country?: string | null; startDate?: string | null; endDate?: string | null; slug?: string | null; photo?: string | null }[] | null;
} | null;

type Linked = { title?: string | null; text?: string | null; more?: string | null; url?: string | null; photo?: string | null };
/** One block under the text, resolved (`retreat` / `yogaClass`: a card of that retreat / lesstijl). */
export type NewsletterBlock = { _key: string } & (
  | { _type: "retreat" | "yogaClass"; title?: string | null; country?: string | null; tagline?: string | null; startDate?: string | null; endDate?: string | null; slug?: string | null; photo?: string | null }
  | ({ _type: "newsletterCard" } & Linked)
  | { _type: "newsletterButton"; label?: string | null; url?: string | null }
  | { _type: "newsletterText"; body?: MailBlock[] | null }
  | { _type: "reference" } // a reference to a deleted document
);

/** `{naam}` in the text → their first name (empty if they only gave an e-mail address). `site`: e.g. https://yogazentonic.com */
export function newsletterIssueContent(lang: Lang, issue: NewsletterIssue, name: string | undefined, unsubscribeUrl: string | null, site: string) {
  const vars = { naam: firstName(name) };
  // empty name: “Dag {naam},” → “Dag,”, “ga je mee, {naam}?” → “ga je mee?”
  const f = (s: string) => fill(s, vars).replace(/ ,/g, ",").replace(/,\s*(?=[?!.])/g, "");
  const blocks = issue?.body ?? [];
  // a path on the site (“/retreats”) → that page in their language
  const link = (u: string | null | undefined) => (u?.startsWith("/") ? `${site}${translatePath(u, lang)}` : u || undefined);
  const more = lang === "en" ? "More info" : "Meer info";
  const retreatCard = (r: { title?: string | null; country?: string | null; startDate?: string | null; endDate?: string | null; slug?: string | null; photo?: string | null }) =>
    r?.title && r.slug ? { card: { title: r.title, meta: [dateRange(lang, r.startDate, r.endDate), r.country].filter(Boolean).join(" · "), url: `${site}${retreatHref(lang, r.slug)}`, photo: r.photo, more } } : null;
  const section = (b: NewsletterBlock): MailSection | null => {
    switch (b._type) {
      case "retreat":
        return retreatCard(b);
      case "yogaClass":
        return b.title ? { card: { title: b.title, meta: b.tagline ?? undefined, url: `${site}${href(lang, "lessons", { hash: b.slug ?? undefined })}`, photo: b.photo, more } } : null;
      case "newsletterCard": {
        const url = link(b.url);
        return b.title && url ? { card: { title: f(b.title), text: b.text ? f(b.text) : undefined, url, photo: b.photo, more: b.more || more } } : null;
      }
      case "newsletterButton": {
        const url = link(b.url);
        return b.label && url ? { button: { label: f(b.label), url } } : null;
      }
      case "newsletterText":
        return b.body?.length ? { blocks: b.body } : null;
      default:
        return null;
    }
  };
  const oldButton = link(issue?.button?.url);
  const sections = [
    ...(issue?.blocks ?? []).map(section),
    ...(issue?.retreats ?? []).map(retreatCard),
    issue?.button?.label && oldButton ? { button: { label: issue.button.label, url: oldButton } } : null,
  ].filter((s): s is MailSection => !!s);
  const content: MailContent = {
    heading: issue?.heading ?? undefined,
    photo: issue?.image,
    text: blocks.length ? blocksText(blocks, f) : "",
    blocks,
    fill: f,
    sections,
    unsubscribe: unsubscribeUrl ? { label: getDictionary(lang).footer.unsubscribeLink, url: unsubscribeUrl } : null,
  };
  return { subject: issue?.subject ? f(issue.subject) : (issue?.title ?? "Yoga, Zen & Tonic"), content };
}
