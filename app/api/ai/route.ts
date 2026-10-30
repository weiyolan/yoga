/**
 * AI helpers for the Studio (✨ actions): POST { task: "alt" | "translate", ticket, … }.
 * Auth: a one-off Studio ticket (lib/studio-ticket.ts).
 */
import { NextResponse, type NextRequest } from "next/server";
import { altText, geminiConfigured, translate } from "@/lib/gemini";
import { dataset, projectId } from "@/sanity/env";
import { cors, json, redeemTicket } from "@/lib/studio-ticket";
import { writeClient } from "@/sanity/write";

const IMAGE = new RegExp(`^https://cdn\\.sanity\\.io/images/${projectId}/${dataset}/[\\w-]+\\.(jpg|jpeg|png|webp)(\\?.*)?$`);

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(request) });
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
