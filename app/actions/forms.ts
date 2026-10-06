"use server";

import { randomUUID } from "node:crypto";
import { getDictionary } from "@/lib/dictionary";
import { dateRange } from "@/lib/format";
import { sendMail } from "@/lib/mail";
import { isUpcoming, sanityFetch } from "@/sanity/fetch";
import { LAYOUT_QUERY, SIGNUP_RETREAT_QUERY } from "@/sanity/queries";
import { writeClient } from "@/sanity/write";

export type FormState = { status: "idle" | "sent" | "invalid" | "error" };

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

/** Contact page form. `website` is a honeypot: bots fill it, people never see it. */
export async function sendContact(_: FormState, data: FormData): Promise<FormState> {
  if (field(data, "website")) return { status: "sent" };
  const name = field(data, "name", 200);
  const email = field(data, "email", 200);
  const subject = field(data, "subject", 200);
  const message = field(data, "message");
  const notify = data.get("notify") === "on";
  if (!name || !EMAIL.test(email) || !message) return { status: "invalid" };
  try {
    await sendMail({
      to: await recipient(),
      replyTo: email,
      subject: `Website: ${subject || "bericht"} (${name})`,
      text: [`Naam: ${name}`, `E-mail: ${email}`, `Onderwerp: ${subject || "-"}`, `Op de hoogte houden: ${notify ? "ja" : "nee"}`, "", message].join("\n"),
    });
    return { status: "sent" };
  } catch (err) {
    console.error("contact form", err);
    return { status: "error" };
  }
}

/** Footer "Hou me op de hoogte": a notification mail until a mailing-list provider is chosen. */
export async function subscribe(_: FormState, data: FormData): Promise<FormState> {
  if (field(data, "website")) return { status: "sent" };
  const email = field(data, "email", 200);
  if (!EMAIL.test(email)) return { status: "invalid" };
  try {
    await sendMail({ to: await recipient(), replyTo: email, subject: `Website: nieuwe inschrijving nieuwsbrief`, text: `Graag op de hoogte houden: ${email}` });
    return { status: "sent" };
  } catch (err) {
    console.error("subscribe", err);
    return { status: "error" };
  }
}

/**
 * Retreat page sign-up: stored as a `signup` document (Studio → Inschrijvingen), then a mail
 * to the team and a confirmation to the participant. The dotted `_id` keeps it out of the public API.
 * Once stored, mail failures are logged but don't fail the form (no duplicate sign-ups on retry).
 */
export async function signup(_: FormState, data: FormData): Promise<FormState> {
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
    if (writeClient) await writeClient.create(doc);
    else console.info("[signup:dev] not stored (no SANITY_WRITE_TOKEN)", doc);
  } catch (err) {
    console.error("signup: store", err);
    return { status: "error" };
  }

  const t = getDictionary(lang).signup;
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
    sendMail({ to: email, subject: t.mailSubject(title), text: t.mailBody(name, title, when) }),
  ];
  for (const r of await Promise.allSettled(mails)) if (r.status === "rejected") console.error("signup: mail", r.reason);
  return { status: "sent" };
}
