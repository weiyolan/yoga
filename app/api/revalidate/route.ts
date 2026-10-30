/**
 * Sanity webhook → on-demand revalidation (the whole site; it's small and
 * references cross documents). Setup: README → "Publish → live".
 */
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { SANITY_TAG } from "@/sanity/fetch";

const PRIVATE_TYPES = new Set(["signup", "message", "subscriber", "reviewSubmission", "aiTicket"]);

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ message: "SANITY_REVALIDATE_SECRET is not set" }, { status: 500 });
  const body = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? "";
  if (!(await isValidSignature(body, signature, secret))) return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  let type: string | undefined;
  try {
    type = (JSON.parse(body) as { _type?: string })._type;
  } catch {
    return NextResponse.json({ message: "Bad body" }, { status: 400 });
  }
  // Form submissions and AI tickets are private (dotted ids) and never on a page: nothing to refresh.
  if (type && PRIVATE_TYPES.has(type)) return NextResponse.json({ revalidated: false, type });
  // expire: 0 → the next visitor gets the new content (not a stale copy first)
  revalidateTag(SANITY_TAG, { expire: 0 });
  // …and every page path explicitly, so hosts that cache per path (Netlify) refresh them too.
  revalidatePath("/[lang]", "layout");
  return NextResponse.json({ revalidated: true, tag: SANITY_TAG, type, now: Date.now() });
}
