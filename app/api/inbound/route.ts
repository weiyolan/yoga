/**
 * Mail forwarding: mail to any address on the domain (contact@yogazentonic.com, …) reaches Resend
 * (Receiving: the domain's MX record points to Resend), which calls this webhook (`email.received`).
 * The mail is passed on as it was (text, HTML, attachments, inline images) to the team: CONTACT_TO, else
 * Studio → Mails → Opties → “Meldingen naar”, else the Contact page e-mail. It is sent from CONTACT_FROM
 * as “<sender> via Yoga, Zen & Tonic”, with Reply-To the original sender, so “Reply” answers them.
 * Signed by Resend (RESEND_WEBHOOK_SECRET); a retried webhook never sends twice (idempotency key).
 */
import PostalMime from "postal-mime";
import { Resend } from "resend";
import { sanityFetch } from "@/sanity/fetch";
import { LAYOUT_QUERY } from "@/sanity/queries";

const addr = (s: string) => (s.match(/<([^>]+)>/)?.[1] ?? s).trim().toLowerCase();
const domainOf = (s: string) => addr(s).split("@")[1] ?? "";

export async function POST(request: Request) {
  const key = process.env.RESEND_API_KEY;
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const from = process.env.CONTACT_FROM;
  if (!key || !secret || !from) return new Response("Forwarding not set up", { status: 501 });
  const resend = new Resend(key);

  const payload = await request.text();
  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    });
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }
  if (event.type !== "email.received") return new Response(null, { status: 204 });
  const { email_id, from: sender } = event.data;

  // our own mails (e.g. a bounce of a forward, or the site writing to contact@) never go round in circles
  const ours = [domainOf(from), ...event.data.received_for.map(domainOf)];
  if (addr(sender) === addr(from)) return new Response(null, { status: 204 });

  const settings = await sanityFetch({ query: LAYOUT_QUERY });
  const to = (process.env.CONTACT_TO || settings?.notifyEmail || settings?.email || "")
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a && !ours.includes(domainOf(a)));
  if (!to.length) {
    console.error("inbound: no team address to forward to (an address on the receiving domain would loop)");
    return new Response("No recipient", { status: 500 });
  }

  const { data: mail, error } = await resend.emails.receiving.get(email_id);
  if (error || !mail?.raw?.download_url) {
    console.error("inbound: get", email_id, error);
    return new Response("Not available yet", { status: 500 }); // Resend retries
  }
  const raw = await fetch(mail.raw.download_url);
  if (!raw.ok) return new Response("Raw mail not available", { status: 500 });
  const parsed = await PostalMime.parse(await raw.arrayBuffer(), { attachmentEncoding: "base64" });

  const name = parsed.from?.name || addr(sender);
  const fromAddr = addr(from);
  const replyTo = mail.reply_to?.length ? mail.reply_to : [sender];
  const { error: sendError } = await resend.emails.send(
    {
      from: `${name.replace(/["<>]/g, "")} via Yoga, Zen & Tonic <${fromAddr}>`,
      to,
      replyTo,
      subject: mail.subject || parsed.subject || "(geen onderwerp)",
      text: parsed.text || "",
      ...(parsed.html ? { html: parsed.html } : {}),
      attachments: parsed.attachments.length
        ? parsed.attachments.map((a) => ({
            filename: a.filename ?? undefined,
            content: String(a.content),
            contentType: a.mimeType,
            contentId: a.contentId?.replace(/^<|>$/g, "") || undefined,
          }))
        : undefined,
      headers: { "X-Forwarded-For-Address": event.data.received_for.join(", ") },
    },
    { idempotencyKey: `forward/${email_id}` },
  );
  if (sendError) {
    console.error("inbound: forward", email_id, sendError);
    return new Response("Forward failed", { status: 500 });
  }
  return new Response(null, { status: 204 });
}
