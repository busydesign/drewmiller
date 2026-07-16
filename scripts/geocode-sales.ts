/**
 * Geocode sales + listings missing coordinates (Nominatim, ~1 req/sec).
 * Usage: npm run db:geocode [limit]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  geocodePropertyAddress,
  normalizeGeocodeAddress,
} from "../src/lib/geocode";

const prisma = new PrismaClient();

async function syncCoordsBetweenSalesAndListings() {
  const salesWithCoords = await prisma.sale.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    select: { address: true, latitude: true, longitude: true, listingId: true },
  });

  let synced = 0;
  for (const sale of salesWithCoords) {
    if (sale.listingId) {
      const byId = await prisma.listing.updateMany({
        where: {
          id: sale.listingId,
          OR: [{ latitude: null }, { longitude: null }],
        },
        data: { latitude: sale.latitude, longitude: sale.longitude },
      });
      synced += byId.count;
    }
    const byAddress = await prisma.listing.updateMany({
      where: {
        address: sale.address,
        OR: [{ latitude: null }, { longitude: null }],
      },
      data: { latitude: sale.latitude, longitude: sale.longitude },
    });
    synced += byAddress.count;
  }

  // Also push listing coords onto sales missing them
  const listingsWithCoords = await prisma.listing.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    select: { id: true, address: true, latitude: true, longitude: true },
  });
  for (const listing of listingsWithCoords) {
    const byListing = await prisma.sale.updateMany({
      where: {
        listingId: listing.id,
        OR: [{ latitude: null }, { longitude: null }],
      },
      data: { latitude: listing.latitude, longitude: listing.longitude },
    });
    synced += byListing.count;
    const byAddress = await prisma.sale.updateMany({
      where: {
        address: listing.address,
        OR: [{ latitude: null }, { longitude: null }],
      },
      data: { latitude: listing.latitude, longitude: listing.longitude },
    });
    synced += byAddress.count;
  }

  // Fuzzy: match by normalized address when exact string differs
  const salesMissing = await prisma.sale.findMany({
    where: { OR: [{ latitude: null }, { longitude: null }] },
    select: { id: true, address: true },
  });
  const listingIndex = new Map(
    listingsWithCoords.map((l) => [
      normalizeGeocodeAddress(l.address).toLowerCase(),
      l,
    ])
  );
  for (const sale of salesMissing) {
    const hit = listingIndex.get(
      normalizeGeocodeAddress(sale.address).toLowerCase()
    );
    if (!hit) continue;
    await prisma.sale.update({
      where: { id: sale.id },
      data: { latitude: hit.latitude, longitude: hit.longitude },
    });
    synced++;
  }

  return synced;
}

async function main() {
  const limit = Number(process.argv[2] || 80);

  const syncedBefore = await syncCoordsBetweenSalesAndListings();
  console.log(`Synced ${syncedBefore} rows from existing coordinates…`);

  const listings = await prisma.listing.findMany({
    where: {
      published: true,
      OR: [{ latitude: null }, { longitude: null }],
    },
    take: limit,
    orderBy: [{ updatedAt: "desc" }],
    select: { id: true, address: true, status: true },
  });

  console.log(`Geocoding ${listings.length} listings…`);
  let listingOk = 0;
  for (const listing of listings) {
    const geo = await geocodePropertyAddress(listing.address);
    if (geo) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { latitude: geo.latitude, longitude: geo.longitude },
      });
      await prisma.sale.updateMany({
        where: {
          AND: [
            {
              OR: [
                { listingId: listing.id },
                { address: listing.address },
              ],
            },
            { OR: [{ latitude: null }, { longitude: null }] },
          ],
        },
        data: { latitude: geo.latitude, longitude: geo.longitude },
      });
      listingOk++;
      console.log(`✓ listing ${listing.status} · ${listing.address}`);
    } else {
      console.log(`× listing · ${listing.address}`);
    }
  }

  const sales = await prisma.sale.findMany({
    where: { OR: [{ latitude: null }, { longitude: null }] },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  console.log(`\nGeocoding ${sales.length} sales…`);
  let saleOk = 0;
  for (const sale of sales) {
    const geo = await geocodePropertyAddress(sale.address);
    if (geo) {
      await prisma.sale.update({
        where: { id: sale.id },
        data: { latitude: geo.latitude, longitude: geo.longitude },
      });
      await prisma.listing.updateMany({
        where: {
          address: sale.address,
          OR: [{ latitude: null }, { longitude: null }],
        },
        data: { latitude: geo.latitude, longitude: geo.longitude },
      });
      saleOk++;
      console.log(`✓ sale · ${sale.address}`);
    } else {
      console.log(`× sale · ${sale.address}`);
    }
  }

  const syncedAfter = await syncCoordsBetweenSalesAndListings();

  const [salesWith, listingsWith, salesMissing, listingsMissing] =
    await Promise.all([
      prisma.sale.count({
        where: { latitude: { not: null }, longitude: { not: null } },
      }),
      prisma.listing.count({
        where: {
          published: true,
          latitude: { not: null },
          longitude: { not: null },
        },
      }),
      prisma.sale.count({
        where: { OR: [{ latitude: null }, { longitude: null }] },
      }),
      prisma.listing.count({
        where: {
          published: true,
          OR: [{ latitude: null }, { longitude: null }],
        },
      }),
    ]);

  console.log(
    `\nDone. listings ${listingOk}/${listings.length}, sales ${saleOk}/${sales.length}, synced +${syncedAfter}`
  );
  console.log(
    `Totals with coords — sales: ${salesWith} (${salesMissing} missing), listings: ${listingsWith} (${listingsMissing} missing)`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
