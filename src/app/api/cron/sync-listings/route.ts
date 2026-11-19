import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { syncTeamListings } from "@/lib/listing-import/sync-team-listings";
import { revalidateListingPages } from "@/lib/revalidate-listings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 180;

let syncing = false;

async function run() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (syncing) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      created: 0,
      updated: 0,
      closed: 0,
      total: 0,
    });
  }

  syncing = true;
  try {
    const result = await syncTeamListings();
    revalidateListingPages();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  } finally {
    syncing = false;
  }
}

export async function GET() {
  return run();
}

export async function POST() {
  return run();
}
