import "server-only";
import { Resend } from "resend";
import { mailHtml, mailText, type MailContent } from "./mail-template";

/**
 * Sends a mail through Resend, as HTML (lib/mail-template.ts) + plain text. Without RESEND_API_KEY
 * (local dev) the plain text is logged instead, so forms work end-to-end without a provider.
 */
export async function sendMail({ to, subject, replyTo, ...content }: { to: string; subject: string; replyTo?: string } & MailContent) {
  const text = mailText(content);
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[mail:dev] to=${to} subject=${subject}\n${text}`);
    return;
  }
  const from = process.env.CONTACT_FROM || "Yoga, Zen & Tonic <website@yogazentonic.com>";
  const { error } = await new Resend(key).emails.send({ from, to, subject, text, html: mailHtml(content), replyTo });
  if (error) throw new Error(error.message);
}
