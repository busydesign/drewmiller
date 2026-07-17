import type { MapPin } from "@/components/SalesMap";
import { prisma } from "@/lib/db";

/**
 * Build map pins from completed sales only.
 * - Sold listings (status SOLD) are the source of truth
 * - Sale rows linked to current/unsold listings are excluded
 */
export async function getSalesMapPins(): Promise<{
  sold: MapPin[];
  current: MapPin[];
  suburbs: Array<{ suburb: string; count: number }>;
}> {
  const [sales, soldListings, currentListings] = await Promise.all([
    prisma.sale.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      orderBy: { soldDate: "desc" },
    }),
    prisma.listing.findMany({
      where: {
        published: true,
        status: "SOLD",
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        slug: true,
        address: true,
        suburb: true,
        latitude: true,
        longitude: true,
        soldPriceCents: true,
        soldDate: true,
      },
    }),
    prisma.listing.findMany({
      where: {
        published: true,
        status: { in: ["FOR_SALE", "UNDER_OFFER", "COMING_SOON"] },
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        slug: true,
        address: true,
        suburb: true,
        latitude: true,
        longitude: true,
        listedPriceLabel: true,
      },
    }),
  ]);

  const linkedIds = sales
    .map((s) => s.listingId)
    .filter((id): id is string => Boolean(id));

  const listingById = new Map(
    (
      await prisma.listing.findMany({
        where: { id: { in: linkedIds } },
        select: { id: true, status: true, slug: true },
      })
    ).map((l) => [l.id, l])
  );

  const soldPins = new Map<string, MapPin>();

  for (const listing of soldListings) {
    const key = pinKey(listing.address, listing.latitude, listing.longitude);
    soldPins.set(key, {
      id: `listing-${listing.id}`,
      address: listing.address,
      suburb: listing.suburb,
      latitude: listing.latitude as number,
      longitude: listing.longitude as number,
      soldPriceCents: listing.soldPriceCents,
      soldDate: listing.soldDate?.toISOString() ?? null,
      listingSlug: listing.slug,
      kind: "sold",
    });
  }

  for (const sale of sales) {
    const linked = sale.listingId ? listingById.get(sale.listingId) : null;

    // Never show a sold pin for a listing still on the market
    if (linked && linked.status !== "SOLD") continue;

    const key = pinKey(sale.address, sale.latitude, sale.longitude);
    const existing = soldPins.get(key);
    if (existing) {
      soldPins.set(key, {
        ...existing,
        soldPriceCents: existing.soldPriceCents ?? sale.soldPriceCents,
        soldDate:
          existing.soldDate ?? sale.soldDate?.toISOString() ?? null,
        listingSlug: existing.listingSlug ?? linked?.slug ?? null,
      });
      continue;
    }

    // Skip loose duplicates of a sold listing at nearly the same point
    const nearDuplicate = [...soldPins.values()].some(
      (pin) =>
        pin.address.toLowerCase() === sale.address.toLowerCase() ||
        (Math.abs(pin.latitude - (sale.latitude as number)) < 0.00015 &&
          Math.abs(pin.longitude - (sale.longitude as number)) < 0.00015)
    );
    if (nearDuplicate) continue;

    soldPins.set(key, {
      id: `sale-${sale.id}`,
      address: sale.address,
      suburb: sale.suburb,
      latitude: sale.latitude as number,
      longitude: sale.longitude as number,
      soldPriceCents: sale.soldPriceCents,
      soldDate: sale.soldDate?.toISOString() ?? null,
      listingSlug: linked?.slug ?? null,
      kind: "sold",
    });
  }

  const sold = [...soldPins.values()];
  const current: MapPin[] = currentListings.map((listing) => ({
    id: `current-${listing.id}`,
    address: listing.address,
    suburb: listing.suburb,
    latitude: listing.latitude as number,
    longitude: listing.longitude as number,
    priceLabel: listing.listedPriceLabel,
    listingSlug: listing.slug,
    kind: "current" as const,
  }));

  const suburbCounts = new Map<string, number>();
  for (const pin of sold) {
    const suburb = (pin.suburb || "North Shore").trim();
    suburbCounts.set(suburb, (suburbCounts.get(suburb) || 0) + 1);
  }
  const suburbs = [...suburbCounts.entries()]
    .map(([suburb, count]) => ({ suburb, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return { sold, current, suburbs };
}

function pinKey(
  address: string,
  latitude: number | null,
  longitude: number | null
) {
  return `${address.toLowerCase()}|${latitude?.toFixed(5)}|${longitude?.toFixed(5)}`;
}
