import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const salesCountLabel = String(body.salesCountLabel || "").trim();
  const salesVolumeLabel = String(body.salesVolumeLabel || "").trim();

  if (!salesCountLabel || !salesVolumeLabel) {
    return NextResponse.json(
      { error: "Sales count and volume labels are required." },
      { status: 400 }
    );
  }

  if (salesCountLabel.length > 40 || salesVolumeLabel.length > 40) {
    return NextResponse.json(
      { error: "Keep each label under 40 characters." },
      { status: 400 }
    );
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      salesCountLabel,
      salesVolumeLabel,
    },
    update: {
      salesCountLabel,
      salesVolumeLabel,
    },
  });

  return NextResponse.json({
    ok: true,
    salesCountLabel: settings.salesCountLabel,
    salesVolumeLabel: settings.salesVolumeLabel,
  });
}
