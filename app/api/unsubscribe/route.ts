/**
 * GET /api/unsubscribe?id=subscriber.<hash>&t=<signature>[&e=<e-mail>&lang=en]: the link in the newsletter mails
 * (lib/unsubscribe.ts). Marks the subscriber “Uitgeschreven” (Studio → Contactboek) and shows a short
 * page in their language. Not indexed.
 */
import { type NextRequest } from "next/server";
import { getDictionary } from "@/lib/dictionary";
import { subscriberId, verifyUnsubscribe } from "@/lib/unsubscribe";
import { writeClient } from "@/sanity/write";

const page = (lang: "nl" | "en", ok: boolean) => {
  const t = getDictionary(lang).footer;
  const home = lang === "en" ? "/en" : "/";
  return new Response(
    `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>Yoga, Zen &amp; Tonic</title></head>
<body style="margin:0;background:#F4F1EC;font:17px/1.6 -apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#1A1917">
<main style="max-width:520px;margin:15vh auto;padding:0 24px"><p style="font:28px/1 Georgia,serif;margin:0 0 28px">Yoga, Zen <em style="color:#D4552B">&amp;</em> Tonic</p>
<p>${ok ? t.unsubscribed : t.unsubscribeFailed}</p><p><a href="${home}" style="color:#D4552B">yogazentonic.com</a></p></main></body></html>`,
    { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" } },
  );
};

/** One-click unsubscribe from the mail app (List-Unsubscribe-Post header, lib/mail.ts sendMany): same link, POST. */
export async function POST(request: NextRequest) {
  const res = await GET(request);
  return new Response(null, { status: res.status });
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const t = request.nextUrl.searchParams.get("t") ?? "";
  if (!writeClient || !verifyUnsubscribe(id, t)) return page("nl", false);
  try {
    const doc = await writeClient.getDocument<{ lang?: string }>(id);
    // no subscriber document yet (e.g. a retreat participant who got a newsletter): made from `e`, which must hash to the signed id
    const email = request.nextUrl.searchParams.get("e")?.trim().toLowerCase();
    const lang = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "nl";
    if (!doc && !(email && subscriberId(email) === id)) return page("nl", false);
    const now = new Date().toISOString();
    await writeClient
      .transaction()
      .createIfNotExists({ _id: id, _type: "subscriber", email, lang, source: "unsubscribe", subscribedAt: now })
      .patch(id, (p) => p.set({ unsubscribed: true, unsubscribedAt: now }))
      .commit();
    return page(doc ? (doc.lang === "en" ? "en" : "nl") : lang, true);
  } catch (err) {
    console.error("unsubscribe", err);
    return page("nl", false);
  }
}
