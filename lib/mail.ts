import "server-only";
import { createTransport } from "nodemailer";
import { Resend } from "resend";
import { mailHtml, mailText, type MailContent } from "./mail-template";

/**
 * Sends a mail as HTML (lib/mail-template.ts) + plain text, through the first one that is set up:
 * - `SMTP_URL`: any mailbox, e.g. a Gmail address with an app password
 *   (`smtps://you%40gmail.com:<app-password>@smtp.gmail.com:465`); sent from that address.
 * - `RESEND_API_KEY`: Resend. Without a verified domain only to the Resend account's own address
 *   (enough for the team notifications); `CONTACT_FROM` on a verified domain mails anyone.
 * Neither (local dev): the plain text is logged, so forms work end-to-end without a provider.
 * `to` may hold several addresses, comma-separated.
 */
export async function sendMail({ to, subject, replyTo, ...content }: { to: string; subject: string; replyTo?: string } & MailContent) {
  const text = mailText(content);
  const html = mailHtml(content);
  const recipients = to.split(",").map((a) => a.trim()).filter(Boolean);
  const smtp = process.env.SMTP_URL;
  const key = process.env.RESEND_API_KEY;
  if (smtp) {
    const transport = createTransport(smtp);
    const user = decodeURIComponent(new URL(smtp).username);
    await transport.sendMail({ from: process.env.CONTACT_FROM || `Yoga, Zen & Tonic <${user}>`, to: recipients, subject, text, html, replyTo });
    return;
  }
  if (key) {
    const from = process.env.CONTACT_FROM || "Yoga, Zen & Tonic <onboarding@resend.dev>";
    const { error } = await new Resend(key).emails.send({ from, to: recipients, subject, text, html, replyTo });
    if (error) throw new Error(error.message);
    return;
  }
  console.info(`[mail:dev] to=${to} subject=${subject}\n${text}`);
}

type Mail = { to: string; subject: string; replyTo?: string } & MailContent;

/**
 * Many personal mails at once (a newsletter: each with its own unsubscribe link, also as the
 * List-Unsubscribe header). Resend: batches of 100 per request. SMTP: one connection, one by one.
 * Returns how many went out; throws only when none did.
 */
export async function sendMany(mails: Mail[]): Promise<{ sent: number; failed: string[] }> {
  const smtp = process.env.SMTP_URL;
  const key = process.env.RESEND_API_KEY;
  const failed: string[] = [];
  let sent = 0;
  const headers = (m: Mail): Record<string, string> =>
    m.unsubscribe ? { "List-Unsubscribe": `<${m.unsubscribe.url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : {};
  if (smtp) {
    const transport = createTransport(smtp);
    const user = decodeURIComponent(new URL(smtp).username);
    const from = process.env.CONTACT_FROM || `Yoga, Zen & Tonic <${user}>`;
    for (const { to, subject, replyTo, ...content } of mails) {
      try {
        await transport.sendMail({ from, to, subject, text: mailText(content), html: mailHtml(content), replyTo, headers: headers({ to, subject, ...content }) });
        sent++;
      } catch (err) {
        console.error("mail", to, err);
        failed.push(to);
      }
    }
    transport.close();
  } else if (key) {
    const resend = new Resend(key);
    const from = process.env.CONTACT_FROM || "Yoga, Zen & Tonic <onboarding@resend.dev>";
    for (let i = 0; i < mails.length; i += 100) {
      const chunk = mails.slice(i, i + 100);
      const { error } = await resend.batch.send(
        chunk.map(({ to, subject, replyTo, ...content }) => ({ from, to: [to], subject, text: mailText(content), html: mailHtml(content), replyTo, headers: headers({ to, subject, ...content }) })),
      );
      if (error) {
        console.error("mail batch", error);
        failed.push(...chunk.map((m) => m.to));
      } else sent += chunk.length;
    }
  } else {
    for (const m of mails) console.info(`[mail:dev] to=${m.to} subject=${m.subject}`);
    sent = mails.length;
  }
  if (!sent && failed.length) throw new Error(`Geen enkele mail verstuurd (${failed.length} mislukt)`);
  return { sent, failed };
}

/** Is any mail provider set up? (Else forms only log their mails.) */
export const mailConfigured = () => !!(process.env.SMTP_URL || process.env.RESEND_API_KEY);
