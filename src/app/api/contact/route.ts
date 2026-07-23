import { NextResponse } from "next/server";
import { notifyContactLead } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim() || null;
  const message = String(body.message || "").trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 }
    );
  }

  const mail = await notifyContactLead({ name, email, phone, message });

  if (!mail.sent) {
    return NextResponse.json(
      {
        error:
          "We couldn’t send your message just now. Please email drew.miller@raywhite.com directly, or try again shortly.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, emailed: true });
}
