import "server-only";
import { Resend } from "resend";

/**
 * Sends a notification mail through Resend. Without RESEND_API_KEY (local dev)
 * the message is logged instead, so forms work end-to-end without a provider.
 */
export async function sendMail({ to, subject, text, replyTo }: { to: string; subject: string; text: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[mail:dev] to=${to} subject=${subject}\n${text}`);
    return;
  }
  const from = process.env.CONTACT_FROM || "Yoga, Zen & Tonic <website@yogazentonic.com>";
  const { error } = await new Resend(key).emails.send({ from, to, subject, text, replyTo });
  if (error) throw new Error(error.message);
}
