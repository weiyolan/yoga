/**
 * The contact book: every e-mail address that came in through the website (retreat sign-ups,
 * newsletter, contact form, reviews) or was added in the Studio (`contact`), one row per address. Shared by the Studio (Contact →
 * Contactboek) and the site (sending a newsletter, app/api/mail). No `@/` imports: the Studio imports this too.
 * Needs a token: these documents are private (dotted ids).
 */

const NL = `coalesce(title[language == "nl"][0].value, title[0].value)`;
export const CONTACTS_QUERY = `{
  "signup": *[_type == "signup" && defined(email)]{ _id, name, email, phone, lang, "at": submittedAt, "label": retreat->{ "t": ${NL} }.t },
  "message": *[_type == "message" && defined(email)]{ _id, name, email, phone, lang, "at": submittedAt, "label": subject, notify },
  "subscriber": *[_type == "subscriber" && defined(email)]{ _id, name, email, lang, "at": subscribedAt, source, unsubscribed, unsubscribedAt },
  "review": *[_type == "reviewSubmission" && defined(email)]{ _id, name, email, lang, "at": submittedAt, "label": retreat->{ "t": ${NL} }.t },
  "contact": *[_type == "contact" && defined(email)]{ _id, name, email, phone, lang, "at": addedAt, "label": notes }
}`;

export type ContactSource = "signup" | "message" | "subscriber" | "review" | "contact";
type Raw = { _id: string; name?: string; email?: string; phone?: string; lang?: string; at?: string; label?: string; notify?: boolean; source?: string; unsubscribed?: boolean; unsubscribedAt?: string };
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
  items: { type: ContactSource; id: string; at?: string; label?: string }[];
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
      c.items.push({ type, id: r._id, at: r.at, label: type === "subscriber" ? (r.unsubscribed ? "uitgeschreven" : undefined) : r.label });
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

/** Who gets a newsletter: */
export const AUDIENCES = [
  { value: "subscribers", title: "Nieuwsbrief-abonnees", description: "Schreven zich in via de footer of het contactformulier." },
  { value: "participants", title: "Deelnemers van retreats", description: "Schreven zich ooit in voor een retreat (klanten: mag, met afmeldlink)." },
  { value: "contacts", title: "Iedereen in het contactboek", description: "Ook wie enkel een bericht of review stuurde of met de hand werd toegevoegd. Enkel als ze daar toestemming voor gaven (GDPR)." },
] as const;
export type Audience = (typeof AUDIENCES)[number]["value"];

/** The addresses a newsletter goes to: never someone who unsubscribed. */
export function recipients(list: Contact[], audience: string[] | null | undefined) {
  const a = new Set(audience?.length ? audience : ["subscribers"]);
  return list.filter((c) => !c.unsubscribed && (a.has("contacts") || (a.has("subscribers") && c.subscribed) || (a.has("participants") && c.items.some((i) => i.type === "signup"))));
}
