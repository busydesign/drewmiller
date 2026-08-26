import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { syncTeamListings } from "@/lib/listing-import/sync-team-listings";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function cronSecretOk(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ")
    ? header.slice("Bearer ".length).trim()
    : req.headers.get("x-cron-secret")?.trim() || "";
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function run(req: Request) {
  const admin = await getAdminSession();
  if (!admin && !cronSecretOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncTeamListings();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
