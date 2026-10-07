"use server";

import { createHash, randomUUID } from "node:crypto";
import { getDictionary } from "@/lib/dictionary";
import { dateRange } from "@/lib/format";
import { sendMail } from "@/lib/mail";
import { isUpcoming, sanityFetch } from "@/sanity/fetch";
import { LAYOUT_QUERY, SIGNUP_RETREAT_QUERY } from "@/sanity/queries";
import { writeClient } from "@/sanity/write";

/** `values`: what was typed, so a failed submit refills the form (React resets it after every action). */
export type FormState = { status: "idle" | "sent" | "invalid" | "error"; values?: Record<string, string> };

const keep = (data: FormData, state: FormState): FormState =>
  state.status === "sent" ? state : { ...state, values: Object.fromEntries([...data].filter(([k, v]) => typeof v === "string" && k !== "website" && !k.startsWith("$")) as [string, string][]) };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const field = (data: FormData, name: string, max = 5000) => String(data.get(name) ?? "").trim().slice(0, max);

/** Recipient: CONTACT_TO, else the e-mail in Sanity → Instellingen. */
async function recipient() {
  const settings = await sanityFetch({ query: LAYOUT_QUERY });
  const to = process.env.CONTACT_TO || settings?.email;
  if (!to && !process.env.RESEND_API_KEY) return "(dev: no recipient)";
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

/** Runs each step; the form succeeds if at least one of them did (stored or mailed). */
async function anyOf(label: string, steps: Promise<unknown>[]): Promise<FormState> {
  const results = await Promise.allSettled(steps);
  for (const r of results) if (r.status === "rejected") console.error(label, r.reason);
  return { status: results.some((r) => r.status === "fulfilled") ? "sent" : "error" };
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
  return anyOf("contact form", [
    store({ _id: `message.${randomUUID()}`, _type: "message", status: "new", name, email, subject, message, notify, lang, submittedAt }),
    ...(notify ? [store(subscriberDoc(email, lang, "contact", name), { once: true })] : []),
    recipient().then((to) =>
      sendMail({
        to,
        replyTo: email,
        subject: `Website: ${subject || "bericht"} (${name})`,
        text: [`Naam: ${name}`, `E-mail: ${email}`, `Onderwerp: ${subject || "-"}`, `Op de hoogte houden: ${notify ? "ja" : "nee"}`, "", message].join("\n"),
      }),
    ),
  ]);
}

/** Footer "Hou me op de hoogte": stored as a subscriber (Studio → Nieuwsbrief) + a mail to the team. */
export async function subscribe(_: FormState, data: FormData): Promise<FormState> {
  return keep(data, await subscribeInner(data));
}

async function subscribeInner(data: FormData): Promise<FormState> {
  if (field(data, "website")) return { status: "sent" };
  const email = field(data, "email", 200);
  if (!EMAIL.test(email)) return { status: "invalid" };
  return anyOf("subscribe", [
    store(subscriberDoc(email, langOf(data), "footer"), { once: true }),
    recipient().then((to) => sendMail({ to, replyTo: email, subject: "Website: nieuwe inschrijving nieuwsbrief", text: `Graag op de hoogte houden: ${email}` })),
  ]);
}

/**
 * Retreat page sign-up: stored as a `signup` document (Studio → Inschrijvingen), then a mail
 * to the team and a confirmation to the participant. The dotted `_id` keeps it out of the public API.
 * Once stored, mail failures are logged but don't fail the form (no duplicate sign-ups on retry).
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
  const persons = Math.min(Math.max(Number.parseInt(field(data, "persons", 2), 10) || 1, 1), 10);
  const room = field(data, "room", 200);
  const diet = field(data, "diet", 1000);
  const message = field(data, "message");
  const consent = data.get("consent") === "on";
  if (!name || !EMAIL.test(email) || !consent) return { status: "invalid" };

  const retreat = await sanityFetch({ query: SIGNUP_RETREAT_QUERY, params: { id: field(data, "retreat", 100) }, lang });
  if (!retreat || !isUpcoming(retreat.endDate)) return { status: "invalid" };
  const title = retreat.title ?? "retreat";
  const when = dateRange(lang, retreat.startDate, retreat.endDate);

  const doc = {
    _id: `signup.${randomUUID()}`,
    _type: "signup",
    status: "new",
    retreat: { _type: "reference", _ref: retreat._id },
    name,
    email,
    phone,
    persons,
    room,
    diet,
    message,
    lang,
    consent,
    submittedAt: new Date().toISOString(),
  };
  try {
    await store(doc);
  } catch (err) {
    console.error("signup: store", err);
    return { status: "error" };
  }

  const t = getDictionary(lang).signup;
  const custom = (await sanityFetch({ query: LAYOUT_QUERY, lang }))?.texts?.signupMail;
  const body = custom ? custom.replaceAll("{naam}", name).replaceAll("{retreat}", title).replaceAll("{datum}", when) : t.mailBody(name, title, when);
  const mails = [
    recipient().then((to) =>
      sendMail({
        to,
        replyTo: email,
        subject: `Inschrijving ${title}: ${name}${persons > 1 ? ` (+${persons - 1})` : ""}`,
        text: [
          `Retreat: ${title} (${when})`,
          `Naam: ${name}`,
          `E-mail: ${email}`,
          `GSM: ${phone || "-"}`,
          `Personen: ${persons}`,
          `Kamer: ${room || "-"}`,
          `Dieet: ${diet || "-"}`,
          `Taal: ${lang}`,
          "",
          message || "(geen bericht)",
          "",
          "Bekijk en beheer in de Studio → Inschrijvingen.",
        ].join("\n"),
      }),
    ),
    sendMail({ to: email, subject: t.mailSubject(title), text: body }),
  ];
  for (const r of await Promise.allSettled(mails)) if (r.status === "rejected") console.error("signup: mail", r.reason);
  return { status: "sent" };
}
