import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_ORIGIN = "https://www.drewmiller.co.nz";

// Redirect non-www to www to prevent duplicate content in Google Search Console.
// Build an absolute public URL — request.nextUrl keeps Railway's internal PORT
// (8080), which used to send browsers to https://www.drewmiller.co.nz:8080/.
export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".railway.app") ||
    host.includes("railway");

  if (!isLocal && host === "drewmiller.co.nz") {
    const dest = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      CANONICAL_ORIGIN
    );
    return NextResponse.redirect(dest, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
