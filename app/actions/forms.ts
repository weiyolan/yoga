"use server";

import { createHash, randomUUID } from "node:crypto";
import { getDictionary } from "@/lib/dictionary";
import { confirmation } from "@/lib/confirmation";
import { dateRange } from "@/lib/format";
import { mailConfigured, sendMail } from "@/lib/mail";
import { mailText, type MailContent } from "@/lib/mail-template";
import { isUpcoming, sanityFetch } from "@/sanity/fetch";
import { LAYOUT_QUERY, SIGNUP_RETREAT_QUERY } from "@/sanity/queries";
import { writeClient } from "@/sanity/write";

/** A team notification for Netlify Forms (form “melding”, public/__forms.html): the browser posts it. */
export type Notify = { soort: string; subject: string; naam: string; email: string; bericht: string };

/**
 * `values`: what was typed, so a failed submit refills the form (React resets it after every action).
 * `notify`: set when the team is notified through Netlify Forms (see toTeam).
 */
export type FormState = { status: "idle" | "sent" | "invalid" | "error"; values?: Record<string, string>; notify?: Notify };

const keep = (data: FormData, state: FormState): FormState =>
  state.status === "sent" ? state : { ...state, values: Object.fromEntries([...data].filter(([k, v]) => typeof v === "string" && k !== "website" && !k.startsWith("$")) as [string, string][]) };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const field = (data: FormData, name: string, max = 5000) => String(data.get(name) ?? "").trim().slice(0, max);

/** Recipient: CONTACT_TO, else Sanity → Instellingen → Formulieren → Meldingen naar, else the contact e-mail. */
async function recipient() {
  const settings = await sanityFetch({ query: LAYOUT_QUERY });
  const to = process.env.CONTACT_TO || settings?.notifyEmail || settings?.email;
  if (!to && !mailConfigured()) return "(dev: no recipient)";
  if (!to) throw new Error("No recipient: set CONTACT_TO or the e-mail in Sanity → Instellingen");
  return to;
}

/**
 * Saves a submission in Sanity (Studio → Berichten / Nieuwsbrief / Inschrijvingen). Dotted ids
 * keep personal data out of the public API. Without SANITY_WRITE_TOKEN it's only logged.
 */
async function store(doc: { _id: string; _type: string; [key: string]: unknown }, { once = false } = {}) {
  if (!writeClient) return void console.info(`[${doc._type}:dev] not stored (no SANITY_WRITE_TOKEN)`, doc);
  if (once) await writeClient.transaction().createIfNotExists(doc).patch(doc._id, (p) => p.set({ unsubscribed: false })).commit();
  else await writeClient.create(doc);
}

/** One subscriber document per address (re-subscribing just clears "unsubscribed"). */
const subscriberDoc = (email: string, lang: string, source: "footer" | "contact", name?: string) => ({
  _id: `subscriber.${createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 32)}`,
  _type: "subscriber",
  email,
  name,
  source,
  lang,
  subscribedAt: new Date().toISOString(),
  unsubscribed: false,
});

/**
 * Team notification (“Inschrijving”, “Bericht”, …). With a mail transport (lib/mail.ts): mailed to
 * Instellingen → “Meldingen naar”. Deployed on Netlify without one: handed back to the browser,
 * which posts it to Netlify Forms (components/Forms.tsx); Netlify mails it to the addresses under
 * Forms → Form notifications. Else (local dev): logged.
 */
function toTeam({ soort, name, email, subject, ...content }: { soort: string; name?: string; email: string; subject: string } & MailContent): { step: Promise<unknown>; notify?: Notify } {
  if (!mailConfigured() && process.env.NETLIFY_FORMS === "1")
    return { step: Promise.resolve(), notify: { soort, subject, naam: name ?? "", email, bericht: mailText(content) } };
  return { step: recipient().then((to) => sendMail({ to, replyTo: email, subject, ...content })) };
}

/** Runs each step; the form succeeds if at least one of them did (stored or the team notified). */
async function anyOf(label: string, steps: Promise<unknown>[], notify?: Notify): Promise<FormState> {
  const results = await Promise.allSettled(steps);
  for (const r of results) if (r.status === "rejected") console.error(label, r.reason);
  return results.some((r) => r.status === "fulfilled") ? { status: "sent", notify } : { status: "error" };
}

const langOf = (data: FormData) => (data.get("lang") === "en" ? "en" : "nl");

/** Contact page form. `website` is a honeypot: bots fill it, people never see it. */
export async function sendContact(_: FormState, data: FormData): Promise<FormState> {
  return keep(data, await sendContactInner(data));
}

async function sendContactInner(data: FormData): Promise<FormState> {
  if (field(data, "website")) return { status: "sent" };
  const lang = langOf(data);
  const name = field(data, "name", 200);
  const email = field(data, "email", 200);
  const subject = field(data, "subject", 200);
  const message = field(data, "message");
  const notify = data.get("notify") === "on";
  if (!name || !EMAIL.test(email) || !message) return { status: "invalid" };
  const submittedAt = new Date().toISOString();
  const team = toTeam({
    soort: "Bericht",
    name,
    email,
    subject: `Website: ${subject || "bericht"} (${name})`,
    text: [`Naam: ${name}`, `E-mail: ${email}`, `Onderwerp: ${subject || "-"}`, `Op de hoogte houden: ${notify ? "ja" : "nee"}`, "", message].join("\n"),
  });
  return anyOf(
    "contact form",
    [
      store({ _id: `message.${randomUUID()}`, _type: "message", status: "new", name, email, subject, message, notify, lang, submittedAt }),
      ...(notify ? [store(subscriberDoc(email, lang, "contact", name), { once: true })] : []),
      team.step,
    ],
    team.notify,
  );
}

/** Footer "Hou me op de hoogte": stored as a subscriber (Studio → Nieuwsbrief) + a mail to the team. */
export async function subscribe(_: FormState, data: FormData): Promise<FormState> {
  return keep(data, await subscribeInner(data));
}

async function subscribeInner(data: FormData): Promise<FormState> {
  if (field(data, "website")) return { status: "sent" };
  const email = field(data, "email", 200);
  if (!EMAIL.test(email)) return { status: "invalid" };
  const team = toTeam({ soort: "Nieuwsbrief", email, subject: "Website: nieuwe inschrijving nieuwsbrief", text: `Graag op de hoogte houden: ${email}` });
  return anyOf("subscribe", [store(subscriberDoc(email, langOf(data), "footer"), { once: true }), team.step], team.notify);
}

/**
 * Retreat sign-up (its own page, /retreats/<slug>/inschrijven): stored as a `signup` document
 * (Studio → Inschrijvingen), then a mail to the team and, when Instellingen → “Bevestigingsmail
 * automatisch versturen” is on, the retreat's confirmation mail to the participant (Studio → Bevestigingsmails).
 * Always one person. The retreat's sign-up form adds questions; their labels and answers are stored
 * as a snapshot (in Dutch, for Rita & Philippe), so editing the form later never changes old sign-ups.
 * The dotted `_id` keeps it out of the public API. Once stored, mail failures are logged but don't
 * fail the form (no duplicate sign-ups on retry). Full retreat → a waiting-list sign-up.
 */
export async function signup(_: FormState, data: FormData): Promise<FormState> {
  return keep(data, await signupInner(data));
}

async function signupInner(data: FormData): Promise<FormState> {
  if (field(data, "website")) return { status: "sent" };
  const lang = data.get("lang") === "en" ? "en" : "nl";
  const name = field(data, "name", 200);
  const email = field(data, "email", 200);
  const phone = field(data, "phone", 50);
  const room = field(data, "room", 200);
  const diet = field(data, "diet", 1000);
  const message = field(data, "message");
  const consent = data.get("consent") === "on";
  const terms = data.get("terms") === "on";
  if (!name || !EMAIL.test(email) || !consent || !terms) return { status: "invalid" };

  const id = field(data, "retreat", 100);
  const [retreat, retreatNl] = await Promise.all([
    sanityFetch({ query: SIGNUP_RETREAT_QUERY, params: { id }, lang }),
    sanityFetch({ query: SIGNUP_RETREAT_QUERY, params: { id }, lang: "nl" }),
  ]);
  if (!retreat || !retreatNl || !isUpcoming(retreat.endDate)) return { status: "invalid" };

  // Extra questions of the retreat's form: required ones must be answered; stored with the Dutch label.
  const t = getDictionary(lang).signup;
  const tNl = getDictionary("nl").signup;
  const questions = (retreat.form?.questions ?? []).filter((q) => q.label);
  const answerOf = (q: (typeof questions)[number], d: typeof t, options: string[]) => {
    const v = field(data, `q.${q._key}`, 2000);
    if (q.type === "yesno") return v === "yes" ? d.yes : v === "no" ? d.no : "";
    if (q.type === "choice") return v && /^\d+$/.test(v) ? (options[Number(v)] ?? "") : "";
    return v;
  };
  const opts = (q?: { options: string[] | null } | null) => (q?.options ?? []).filter(Boolean);
  if (questions.some((q) => q.required && !answerOf(q, t, opts(q)))) return { status: "invalid" };
  const answers = questions.map((q) => {
    const nl = retreatNl.form?.questions?.find((x) => x._key === q._key);
    return { label: q.label ?? "", labelNl: nl?.label ?? q.label ?? "", answer: answerOf(q, t, opts(q)), answerNl: answerOf(q, tNl, opts(nl).length ? opts(nl) : opts(q)) };
  });

  const title = retreat.title ?? "retreat";
  const when = dateRange(lang, retreat.startDate, retreat.endDate);
  // Fully booked (Studio → confirmed sign-ups fill `booked`): a waiting-list request.
  const waitlist = !!retreat.capacity && (retreat.booked ?? 0) >= retreat.capacity;

  const doc = {
    _id: `signup.${randomUUID()}`,
    _type: "signup",
    status: "new",
    retreat: { _type: "reference", _ref: retreat._id },
    name,
    email,
    phone,
    room,
    diet,
    message,
    answers: answers.map((a) => ({ _key: randomUUID().slice(0, 12), _type: "signupAnswer", question: a.labelNl, answer: a.answerNl })),
    form: retreat.form?.name ?? undefined,
    lang,
    consent,
    terms,
    waitlist,
    submittedAt: new Date().toISOString(),
  };
  try {
    await store(doc);
  } catch (err) {
    console.error("signup: store", err);
    return { status: "error" };
  }

  const autoConfirm = (await sanityFetch({ query: LAYOUT_QUERY, lang }))?.autoConfirm === true;
  const mail = confirmation(lang, retreat.mail, retreat, name, waitlist);
  const yours: [string, string][] = [
    [t.phone, phone],
    [t.room, room],
    ...answers.map((a) => [a.label, a.answer] as [string, string]),
    [t.diet, diet],
    [t.message, message],
  ].filter(([, v]) => v) as [string, string][];
  const team = toTeam({
    soort: waitlist ? "Wachtlijst" : "Inschrijving",
    name,
    email,
    subject: `${waitlist ? "Wachtlijst" : "Inschrijving"} ${retreatNl.title ?? title}: ${name}`,
    heading: `${waitlist ? "Wachtlijst" : "Nieuwe inschrijving"}: ${name}`,
    text: `${retreatNl.title ?? title} (${dateRange("nl", retreat.startDate, retreat.endDate)})${waitlist ? "\n\nDe retreat is volzet: dit is een aanvraag voor de wachtlijst." : ""}`,
    rows: [
      ["Naam", name],
      ["E-mail", email],
      ["GSM", phone],
      ["Kamer", room],
      ...answers.map((a) => [a.labelNl, a.answerNl] as [string, string]),
      ["Dieet", diet],
      ["Bericht", message],
      ["Taal", lang],
    ],
    footnote: autoConfirm
      ? "Bekijk en beheer in de Studio → Inschrijvingen. De bevestigingsmail is automatisch verstuurd."
      : "Bekijk en beheer in de Studio → Inschrijvingen. Bevestigingsmail versturen: open de inschrijving → “Bevestigingsmail”.",
  });
  const mails = [
    team.step,
    ...(autoConfirm
      ? [
          sendMail({ to: email, subject: mail.subject, heading: title, photo: retreat.photo, text: mail.text, rows: yours.length ? yours : undefined }).then(() =>
            writeClient?.patch(doc._id).set({ confirmedAt: new Date().toISOString() }).commit(),
          ),
        ]
      : []),
  ];
  for (const r of await Promise.allSettled(mails)) if (r.status === "rejected") console.error("signup: mail", r.reason);
  return { status: "sent", notify: team.notify };
}

/**
 * Review form (past retreat pages, #review): stored as a private `reviewSubmission` (Studio → Reviews)
 * + a mail to the team. Only once the team sets it to "Gepubliceerd" does a public copy (no e-mail) go online.
 */
export async function sendReview(_: FormState, data: FormData): Promise<FormState> {
  return keep(data, await sendReviewInner(data));
}

async function sendReviewInner(data: FormData): Promise<FormState> {
  if (field(data, "website")) return { status: "sent" };
  const lang = langOf(data);
  const name = field(data, "name", 100);
  const email = field(data, "email", 200);
  const text = field(data, "text", 1200);
  const rating = Number.parseInt(field(data, "rating", 1), 10);
  const consent = data.get("consent") === "on";
  if (!name || !EMAIL.test(email) || !text || !(rating >= 1 && rating <= 5) || !consent) return { status: "invalid" };
  const retreat = await sanityFetch({ query: SIGNUP_RETREAT_QUERY, params: { id: field(data, "retreat", 100) }, lang });
  if (!retreat) return { status: "invalid" };
  const team = toTeam({
    soort: "Review",
    name,
    email,
    subject: `Nieuwe review ${"★".repeat(rating)}: ${retreat.title ?? "retreat"} (${name})`,
    text: [`Retreat: ${retreat.title}`, `Naam: ${name}`, `E-mail: ${email}`, `Score: ${rating}/5`, "", text, "", "Keur goed of weiger in de Studio → Reviews."].join("\n"),
  });
  return anyOf(
    "review form",
    [
      store({
        _id: `reviewSubmission.${randomUUID()}`,
        _type: "reviewSubmission",
        status: "new",
        retreat: { _type: "reference", _ref: retreat._id },
        name,
        email,
        rating,
        text,
        lang,
        submittedAt: new Date().toISOString(),
      }),
      team.step,
    ],
    team.notify,
  );
}
