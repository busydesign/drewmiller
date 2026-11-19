import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { runListingSync } from "@/lib/listing-sync-scheduler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 180;

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

function isLoopbackAddress(value: string) {
  const host = value.split(":")[0].trim().toLowerCase();
  return (
    host === "127.0.0.1" ||
    host === "localhost" ||
    host === "::1" ||
    host === "0:0:0:0:0:0:0:1"
  );
}

function isLoopbackSync(req: Request) {
  const host = req.headers.get("host") || "";
  if (!isLoopbackAddress(host)) return false;
  const forwarded = (req.headers.get("x-forwarded-for") || "")
    .split(",")[0]
    .trim();
  return !forwarded || isLoopbackAddress(forwarded);
}

async function run(req: Request) {
  const admin = await getAdminSession();
  if (!admin && !cronSecretOk(req) && !isLoopbackSync(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runListingSync("http");
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
