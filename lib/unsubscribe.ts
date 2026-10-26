import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { siteUrl } from "./metadata";

/**
 * Unsubscribe links: /api/unsubscribe?id=<subscriber id>&t=<signature>. The signature (HMAC of the id)
 * means nobody can unsubscribe someone else by guessing ids. Secret: UNSUBSCRIBE_SECRET, else
 * SANITY_REVALIDATE_SECRET. Without either, mails go out without a link.
 */
const secret = () => process.env.UNSUBSCRIBE_SECRET || process.env.SANITY_REVALIDATE_SECRET || "";
const sign = (id: string) => createHmac("sha256", secret()).update(id).digest("base64url").slice(0, 32);

export function unsubscribeUrl(id: string) {
  return secret() ? `${siteUrl}/api/unsubscribe?id=${encodeURIComponent(id)}&t=${sign(id)}` : null;
}

export function verifyUnsubscribe(id: string, t: string) {
  if (!secret() || !/^subscriber\.[a-f0-9]{32}$/.test(id)) return false;
  const a = Buffer.from(sign(id));
  const b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
}
