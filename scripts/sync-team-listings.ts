/**
 * Sync current listings for Drew’s full team from Ray White Mairangi Bay API.
 */
import "dotenv/config";
import { syncTeamListings } from "../src/lib/listing-import/sync-team-listings";
import { prisma } from "../src/lib/db";

syncTeamListings()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
