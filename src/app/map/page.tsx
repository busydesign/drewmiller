import type { Metadata } from "next";
import { SalesMap, type MapPin } from "@/components/SalesMap";
import { NearbySalesFinder } from "@/components/NearbySalesFinder";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sales map",
  description:
    "Explore Drew Miller’s current and previous North Shore sales on an interactive map. Enter your address to see nearby results.",
};

export default async function MapPage() {
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

  // Merge Sale rows + sold Listings (dedupe by rounded lat/lng + address)
  const soldPins = new Map<string, MapPin>();

  for (const sale of sales) {
    const key = `${sale.address.toLowerCase()}|${sale.latitude?.toFixed(5)}|${sale.longitude?.toFixed(5)}`;
    soldPins.set(key, {
      id: `sale-${sale.id}`,
      address: sale.address,
      suburb: sale.suburb,
      latitude: sale.latitude as number,
      longitude: sale.longitude as number,
      soldPriceCents: sale.soldPriceCents,
      soldDate: sale.soldDate?.toISOString() ?? null,
      listingSlug: null,
      kind: "sold",
    });
  }

  for (const listing of soldListings) {
    const key = `${listing.address.toLowerCase()}|${listing.latitude?.toFixed(5)}|${listing.longitude?.toFixed(5)}`;
    const existing = soldPins.get(key);
    soldPins.set(key, {
      id: existing?.id || `listing-${listing.id}`,
      address: listing.address,
      suburb: listing.suburb,
      latitude: listing.latitude as number,
      longitude: listing.longitude as number,
      soldPriceCents: listing.soldPriceCents ?? existing?.soldPriceCents,
      soldDate:
        listing.soldDate?.toISOString() ?? existing?.soldDate ?? null,
      listingSlug: listing.slug,
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

  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow">Interactive</p>
        <h1 className="display mt-2 text-5xl md:text-6xl">Sales map</h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          Explore homes for sale across the North Shore, or see what nearby
          properties have sold for. Search an address to understand pricing in
          the streets that matter to you.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
          <NearbySalesFinder />
          <SalesMap sold={sold} current={current} />
        </div>

        <p className="mt-4 text-sm text-ink-soft">
          {current.length} homes for sale · {sold.length} sold properties on the
          map.
        </p>
      </div>
    </section>
  );
}
