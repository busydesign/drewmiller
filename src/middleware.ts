import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Redirect non-www to www to prevent duplicate content in Google Search Console
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const isNonWww =
    !host.startsWith("www.") &&
    !host.includes("localhost") &&
    !host.includes("railway") &&
    !host.includes("127.0.0.1");

  if (isNonWww) {
    const url = request.nextUrl.clone();
    url.host = "www." + host;
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
