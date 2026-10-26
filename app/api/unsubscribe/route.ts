/**
 * GET /api/unsubscribe?id=subscriber.<hash>&t=<signature>: the link in the newsletter mails
 * (lib/unsubscribe.ts). Marks the subscriber “Uitgeschreven” (Studio → Nieuwsbrief) and shows a short
 * page in their language. Not indexed.
 */
import { type NextRequest } from "next/server";
import { getDictionary } from "@/lib/dictionary";
import { verifyUnsubscribe } from "@/lib/unsubscribe";
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

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const t = request.nextUrl.searchParams.get("t") ?? "";
  if (!writeClient || !verifyUnsubscribe(id, t)) return page("nl", false);
  try {
    const doc = await writeClient.getDocument<{ lang?: string }>(id);
    if (!doc) return page("nl", false);
    await writeClient.patch(id).set({ unsubscribed: true, unsubscribedAt: new Date().toISOString() }).commit();
    return page(doc.lang === "en" ? "en" : "nl", true);
  } catch (err) {
    console.error("unsubscribe", err);
    return page("nl", false);
  }
}
