/**
 * AI helpers for the Studio (✨ actions): POST { task: "alt" | "translate", ticket, … }.
 * Auth: the Studio first creates a private `aiTicket.<uuid>` document with the editor's own
 * credentials (works with cookie and token login); this route only proceeds if that ticket
 * exists and is fresh, then deletes it. So only people who can edit the dataset can use it.
 */
import { NextResponse, type NextRequest } from "next/server";
import { altText, geminiConfigured, translate } from "@/lib/gemini";
import { dataset, projectId } from "@/sanity/env";
import { writeClient } from "@/sanity/write";

const ORIGINS = new Set(["https://yogazentonic.sanity.studio", "http://localhost:3333"]);
const TTL = 5 * 60_000;
const IMAGE = new RegExp(`^https://cdn\\.sanity\\.io/images/${projectId}/${dataset}/[\\w-]+\\.(jpg|jpeg|png|webp)(\\?.*)?$`);

function cors(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  return origin && ORIGINS.has(origin) ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST", "access-control-allow-headers": "content-type", vary: "origin" } : {};
}
const json = (request: NextRequest, body: unknown, status = 200) => NextResponse.json(body, { status, headers: cors(request) });

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(request) });
}

async function redeemTicket(id: unknown) {
  if (!writeClient || typeof id !== "string" || !/^aiTicket\.[\w-]+$/.test(id)) return false;
  const doc = await writeClient.getDocument(id);
  if (!doc) return false;
  await writeClient.delete(id).catch(() => {});
  return Date.now() - Date.parse(doc._createdAt) < TTL;
}

export async function POST(request: NextRequest) {
  if (!geminiConfigured()) return json(request, { message: "GEMINI_API_KEY ontbreekt op de server (Netlify → Environment variables)." }, 503);
  if (!writeClient) return json(request, { message: "SANITY_WRITE_TOKEN ontbreekt op de server." }, 503);
  let body: { task?: string; ticket?: string; image?: string; context?: string; texts?: Record<string, string>; from?: string; to?: string };
  try {
    body = await request.json();
  } catch {
    return json(request, { message: "Bad body" }, 400);
  }
  if (!(await redeemTicket(body.ticket))) return json(request, { message: "Niet aangemeld in de Studio (of verlopen). Probeer opnieuw." }, 401);

  try {
    if (body.task === "alt") {
      if (!body.image || !IMAGE.test(body.image)) return json(request, { message: "Ongeldige afbeelding" }, 400);
      const url = new URL(body.image);
      url.search = "?w=1024&fit=max&fm=jpg&q=80";
      const img = await fetch(url);
      if (!img.ok) return json(request, { message: `Afbeelding niet geladen (${img.status})` }, 502);
      const base64 = Buffer.from(await img.arrayBuffer()).toString("base64");
      return json(request, await altText({ mime: "image/jpeg", base64 }, body.context?.slice(0, 300)));
    }
    if (body.task === "translate") {
      const texts = Object.fromEntries(Object.entries(body.texts ?? {}).filter(([k, v]) => typeof v === "string" && k.length < 300).slice(0, 200)) as Record<string, string>;
      if (JSON.stringify(texts).length > 60_000) return json(request, { message: "Te veel tekst in één keer" }, 413);
      return json(request, { texts: await translate(texts, body.from === "en" ? "English" : "Dutch", body.to === "nl" ? "Dutch" : "English") });
    }
    return json(request, { message: "Unknown task" }, 400);
  } catch (err) {
    console.error("ai", err);
    return json(request, { message: err instanceof Error ? err.message : "AI-fout" }, 502);
  }
}
