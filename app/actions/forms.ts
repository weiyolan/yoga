"use server";

import { sendMail } from "@/lib/mail";
import { sanityFetch } from "@/sanity/fetch";
import { LAYOUT_QUERY } from "@/sanity/queries";

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
