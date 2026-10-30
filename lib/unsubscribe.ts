import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { siteUrl } from "./metadata";

/**
 * Unsubscribe links: /api/unsubscribe?id=<subscriber id>&t=<signature>. The signature (HMAC of the id)
 * means nobody can unsubscribe someone else by guessing ids. Secret: UNSUBSCRIBE_SECRET, else
 * SANITY_REVALIDATE_SECRET. Without either, mails go out without a link.
 */
const secret = () => process.env.UNSUBSCRIBE_SECRET || process.env.SANITY_REVALIDATE_SECRET || "";
const sign = (id: string) => createHmac("sha256", secret()).update(id).digest("base64url").slice(0, 32);

/** One subscriber document per address: `subscriber.<hash of the e-mail>` (also for someone who never subscribed but unsubscribes). */
export const subscriberId = (email: string) => `subscriber.${createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32)}`;

/** `email`: lets the link also work for an address without subscriber document yet (a retreat participant getting a newsletter). */
export function unsubscribeUrl(id: string, email?: string, lang?: string) {
  return secret() ? `${siteUrl}/api/unsubscribe?id=${encodeURIComponent(id)}&t=${sign(id)}${email ? `&e=${encodeURIComponent(email)}` : ""}${lang === "en" ? "&lang=en" : ""}` : null;
}

export function verifyUnsubscribe(id: string, t: string) {
  if (!secret() || !/^subscriber\.[a-f0-9]{32}$/.test(id)) return false;
  const a = Buffer.from(sign(id));
  const b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
}
