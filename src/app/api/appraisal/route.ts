import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

  return NextResponse.json({ ok: true, id: lead.id });
}
