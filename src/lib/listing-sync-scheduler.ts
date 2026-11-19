export type ListingSyncReason = "scheduled" | "http" | "stale-request";

export type ListingSyncRunResult = {
  created: number;
  updated: number;
  closed: number;
  total: number;
  skipped?: boolean;
};

const INITIAL_DELAY_MS = 45 * 1000;
const INTERVAL_MS = 10 * 60 * 1000;

let started = false;
let running = false;
let lastFinishedAt = 0;

export function startListingSyncScheduler() {
  if (started) return;
  if (process.env.SKIP_LISTING_SYNC === "1") {
    console.log("SKIP_LISTING_SYNC=1 — not scheduling Ray White listing sync");
    return;
  }
  started = true;
  console.log(
    `Ray White listing sync in ${INITIAL_DELAY_MS / 1000}s, then every ${
      INTERVAL_MS / 60000
    }m`
  );
  const tick = () => {
    void runListingSync("scheduled");
  };
  setTimeout(() => {
    tick();
    setInterval(tick, INTERVAL_MS);
  }, INITIAL_DELAY_MS);
}

export function requestListingSyncIfStale(maxAgeMs = INTERVAL_MS) {
  if (process.env.SKIP_LISTING_SYNC === "1") return;
  if (running) return;
  if (lastFinishedAt > 0 && Date.now() - lastFinishedAt < maxAgeMs) return;
  void runListingSync("stale-request");
}

export async function runListingSync(
  reason: ListingSyncReason
): Promise<ListingSyncRunResult> {
  if (running) {
    return { created: 0, updated: 0, closed: 0, total: 0, skipped: true };
  }
  running = true;
  console.log("Ray White listing sync starting", reason);
  try {
    const { syncTeamListings } = await import(
      "@/lib/listing-import/sync-team-listings"
    );
    const { revalidateListingPages } = await import(
      "@/lib/revalidate-listings"
    );
    const result = await syncTeamListings();
    try {
      revalidateListingPages();
    } catch (err) {
      console.error("Listing page revalidate failed", err);
    }
    lastFinishedAt = Date.now();
    console.log("Ray White listing sync finished", reason, result);
    return result;
  } catch (err) {
    console.error("Ray White listing sync failed", reason, err);
    throw err;
  } finally {
    running = false;
  }
}
