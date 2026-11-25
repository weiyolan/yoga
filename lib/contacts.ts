/**
 * The contact book: every e-mail address that came in through the website (retreat sign-ups,
 * newsletter, contact form, reviews) or was added in the Studio (`contact`), one row per address. Shared by the Studio (Contact →
 * Contactboek) and the site (sending a newsletter, app/api/mail). No `@/` imports: the Studio imports this too.
 * Needs a token: these documents are private (dotted ids).
 */

const NL = `coalesce(title[language == "nl"][0].value, title[0].value)`;
export const CONTACTS_QUERY = `{
  "signup": *[_type == "signup" && defined(email)]{ _id, name, email, phone, lang, "at": submittedAt, "label": retreat->{ "t": ${NL} }.t, "retreat": retreat._ref, status, waitlist },
  "message": *[_type == "message" && defined(email)]{ _id, name, email, phone, lang, "at": submittedAt, "label": subject, notify },
  "subscriber": *[_type == "subscriber" && defined(email)]{ _id, name, email, lang, "at": subscribedAt, source, unsubscribed, unsubscribedAt },
  "review": *[_type == "reviewSubmission" && defined(email)]{ _id, name, email, lang, "at": submittedAt, "label": retreat->{ "t": ${NL} }.t },
  "contact": *[_type == "contact" && defined(email)]{ _id, name, email, phone, lang, "at": addedAt, "label": notes }
}`;

export type ContactSource = "signup" | "message" | "subscriber" | "review" | "contact";
type Raw = { _id: string; name?: string; email?: string; phone?: string; lang?: string; at?: string; label?: string; notify?: boolean; source?: string; unsubscribed?: boolean; unsubscribedAt?: string; retreat?: string; status?: string; waitlist?: boolean };
export type ContactsData = Record<ContactSource, Raw[]>;

export type Contact = {
  email: string;
  name?: string;
  phone?: string;
  lang: "nl" | "en";
  /** Most recent / first time this address came in. */
  last?: string;
  first?: string;
  /** Every document it came from, newest first. */
  items: { type: ContactSource; id: string; at?: string; label?: string; retreat?: string; status?: SignupStatus }[];
  /** Has a subscriber document that isn't unsubscribed. */
  subscribed: boolean;
  /** Unsubscribed (link in a mail, or by hand in the Studio): never mailed a newsletter. */
  unsubscribed: boolean;
  subscriberId?: string;
};

export const SOURCE_TITLES: Record<ContactSource, string> = { signup: "Retreat", subscriber: "Nieuwsbrief", message: "Contactformulier", review: "Review", contact: "Toegevoegd" };

export function contacts(data: ContactsData): Contact[] {
  const map = new Map<string, Contact>();
  for (const type of Object.keys(SOURCE_TITLES) as ContactSource[]) {
    for (const r of data[type] ?? []) {
      const email = r.email?.trim().toLowerCase();
      if (!email || !email.includes("@")) continue;
      const c = map.get(email) ?? { email, lang: "nl", items: [], subscribed: false, unsubscribed: false };
      c.items.push({
        type,
        id: r._id,
        at: r.at,
        label: type === "subscriber" ? (r.unsubscribed ? "uitgeschreven" : undefined) : r.label,
        ...(type === "signup" ? { retreat: r.retreat, status: signupStatus(r) } : {}),
      });
      const newer = !c.last || (r.at ?? "") >= c.last;
      if (r.name && (newer || !c.name)) c.name = r.name;
      if (r.phone && (newer || !c.phone)) c.phone = r.phone;
      if (r.lang && newer) c.lang = r.lang === "en" ? "en" : "nl";
      if (r.at && newer) c.last = r.at;
      if (r.at && (!c.first || r.at < c.first)) c.first = r.at;
      if (type === "subscriber") {
        c.subscriberId = r._id;
        c.unsubscribed = r.unsubscribed === true;
        c.subscribed = !c.unsubscribed;
      }
      map.set(email, c);
    }
  }
  for (const c of map.values()) c.items.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  return [...map.values()].sort((a, b) => (b.last ?? "").localeCompare(a.last ?? ""));
}

/** A sign-up's status as on the sign-up card: “Nieuw” with the waiting-list tick counts as Wachtlijst. */
export type SignupStatus = "new" | "confirmed" | "waitlist" | "cancelled";
const signupStatus = (r: Raw): SignupStatus =>
  r.status === "confirmed" || r.status === "cancelled" || r.status === "waitlist" ? r.status : r.waitlist ? "waitlist" : "new";
export const SIGNUP_STATUS_TITLES: Record<SignupStatus, string> = { confirmed: "Bevestigd", new: "Nieuw", waitlist: "Wachtlijst", cancelled: "Geannuleerd" };

/** Who gets a Brief (newsletter) — groups: */
export const AUDIENCES = [
  { value: "subscribers", title: "Nieuwsbrief-abonnees", description: "Schreven zich in via de footer of het contactformulier." },
  { value: "participants", title: "Alle retreat-deelnemers", description: "Schreven zich ooit in voor een retreat (klanten: mag, met afmeldlink)." },
  { value: "contacts", title: "Iedereen in het contactboek", description: "Ook wie enkel een bericht of review stuurde of met de hand werd toegevoegd. Enkel als ze daar toestemming voor gaven (GDPR)." },
] as const;
export type Audience = (typeof AUDIENCES)[number]["value"];

/**
 * Brief → “Naar wie” (`newsletter.to`): groups + the people who signed up for some retreats (with these
 * statuses; default Bevestigd) + people added one by one − people left out. Older letters only have `audience` (groups).
 */
export type Recipients = {
  groups?: string[] | null;
  retreats?: { _ref?: string }[] | null;
  statuses?: string[] | null;
  include?: string[] | null;
  exclude?: string[] | null;
} | null | undefined;

const low = (e: string) => e.trim().toLowerCase();

/** Why a contact gets the letter (empty = not). */
export function reasons(c: Contact, to: Recipients, audience?: string[] | null) {
  const groups = new Set(to ? (to.groups ?? []) : audience?.length ? audience : ["subscribers"]);
  const retreats = new Set((to?.retreats ?? []).map((r) => r._ref).filter(Boolean) as string[]);
  const statuses = new Set(to?.statuses?.length ? to.statuses : ["confirmed"]);
  const out: string[] = [];
  if ((to?.include ?? []).map(low).includes(c.email)) out.push("include");
  if (groups.has("contacts")) out.push("contacts");
  if (groups.has("subscribers") && c.subscribed) out.push("subscribers");
  if (groups.has("participants") && c.items.some((i) => i.type === "signup")) out.push("participants");
  for (const i of c.items) if (i.type === "signup" && i.retreat && retreats.has(i.retreat) && statuses.has(i.status ?? "new")) out.push(`retreat:${i.retreat}`);
  return [...new Set(out)];
}

/** The addresses a Brief goes to: never someone who unsubscribed, nor someone left out by hand. */
export function recipients(list: Contact[], to: Recipients, audience?: string[] | null) {
  const exclude = new Set((to?.exclude ?? []).map(low));
  return list.filter((c) => !c.unsubscribed && !exclude.has(c.email) && reasons(c, to, audience).length > 0);
}
