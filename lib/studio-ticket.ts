import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { writeClient } from "@/sanity/write";

/**
 * Site API routes the Studio calls (/api/ai, /api/mail). Auth: the Studio first creates a private
 * `aiTicket.<uuid>` document with the editor's own credentials (works with cookie and token login);
 * a route only proceeds if that ticket exists and is fresh, then deletes it. So only people who can
 * edit the dataset can use them. The embedded Studio (/studio) is same-origin; these origins get CORS.
 */
const ORIGINS = new Set(["https://yogazentonic.sanity.studio", "http://localhost:3333"]);
const TTL = 5 * 60_000;

export function cors(request: NextRequest, methods = "POST"): Record<string, string> {
  const origin = request.headers.get("origin");
  return origin && ORIGINS.has(origin) ? { "access-control-allow-origin": origin, "access-control-allow-methods": methods, "access-control-allow-headers": "content-type", vary: "origin" } : {};
}

export const json = (request: NextRequest, body: unknown, status = 200) => NextResponse.json(body, { status, headers: cors(request, "GET, POST") });

export async function redeemTicket(id: unknown) {
  if (!writeClient || typeof id !== "string" || !/^aiTicket\.[\w-]+$/.test(id)) return false;
  const doc = await writeClient.getDocument(id);
  if (!doc) return false;
  await writeClient.delete(id).catch(() => {});
  return Date.now() - Date.parse(doc._createdAt) < TTL;
}
