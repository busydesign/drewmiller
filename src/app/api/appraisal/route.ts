import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyAppraisalLead } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim() || null;
  const address = String(body.address || "").trim();
  const message = String(body.message || "").trim() || null;

  if (!name || !email || !address) {
    return NextResponse.json(
      { error: "Name, email, and address are required." },
      { status: 400 }
    );
  }

  const lead = await prisma.appraisalLead.create({
    data: { name, email, phone, address, message, source: "website" },
  });

  const mail = await notifyAppraisalLead({
    name,
    email,
    phone,
    address,
    message,
  });

  if (!mail.sent) {
    return NextResponse.json(
      {
        ok: true,
        id: lead.id,
        emailed: false,
        error:
          "Your request was saved, but we couldn’t email Drew just now. Please also call or text if it’s urgent.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    id: lead.id,
    emailed: true,
  });
}
