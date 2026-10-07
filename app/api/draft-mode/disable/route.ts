/** Leave draft mode and go back to the page you were on (only same-site paths). */
import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  const to = request.nextUrl.searchParams.get("redirect") ?? "/";
  const safe = to.startsWith("/") && !to.startsWith("//") && !to.startsWith("/\\") ? to : "/";
  return NextResponse.redirect(new URL(safe, request.url));
}
