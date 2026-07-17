import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { haversineKm } from "@/lib/geo-distance";
import { geocodePropertyAddress } from "@/lib/geocode";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const address = String(body.address || "").trim();
  const radiusKm = Number(body.radiusKm || 3);

  if (address.length < 5) {
    return NextResponse.json(
      { error: "Enter a fuller street address." },
      { status: 400 }
    );
  }

  const geo = await geocodePropertyAddress(address);
  if (!geo) {
    return NextResponse.json(
      { error: "Couldn’t locate that address. Try adding suburb + Auckland." },
      { status: 404 }
    );
  }

  const [sales, soldListings] = await Promise.all([
    prisma.sale.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      take: 800,
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
  ]);

  const listingMeta = await prisma.listing.findMany({
    where: {
      id: {
        in: sales
          .map((s) => s.listingId)
          .filter((id): id is string => Boolean(id)),
      },
    },
    select: { id: true, status: true, slug: true },
  });
  const byId = new Map(listingMeta.map((l) => [l.id, l]));

  type Nearby = {
    id: string;
    address: string;
    suburb?: string | null;
    soldPriceCents?: number | null;
    soldDate?: string | null;
    distanceKm: number;
    listingSlug?: string | null;
  };

  const nearbyMap = new Map<string, Nearby>();

  for (const listing of soldListings) {
    const distanceKm = haversineKm(
      geo.latitude,
      geo.longitude,
      listing.latitude as number,
      listing.longitude as number
    );
    if (distanceKm > radiusKm) continue;
    nearbyMap.set(listing.id, {
      id: listing.id,
      address: listing.address,
      suburb: listing.suburb,
      soldPriceCents: listing.soldPriceCents,
      soldDate: listing.soldDate?.toISOString() ?? null,
      distanceKm,
      listingSlug: listing.slug,
    });
  }

  for (const sale of sales) {
    const linked = sale.listingId ? byId.get(sale.listingId) : null;
    if (linked && linked.status !== "SOLD") continue;

    const distanceKm = haversineKm(
      geo.latitude,
      geo.longitude,
      sale.latitude as number,
      sale.longitude as number
    );
    if (distanceKm > radiusKm) continue;

    const key =
      linked?.id ||
      `${sale.address.toLowerCase()}|${sale.latitude?.toFixed(4)}|${sale.longitude?.toFixed(4)}`;
    const existing = nearbyMap.get(key);
    if (existing) {
      nearbyMap.set(key, {
        ...existing,
        soldPriceCents: existing.soldPriceCents ?? sale.soldPriceCents,
        soldDate:
          existing.soldDate ?? sale.soldDate?.toISOString() ?? null,
        distanceKm: Math.min(existing.distanceKm, distanceKm),
      });
      continue;
    }

    nearbyMap.set(key, {
      id: sale.id,
      address: sale.address,
      suburb: sale.suburb,
      soldPriceCents: sale.soldPriceCents,
      soldDate: sale.soldDate?.toISOString() ?? null,
      distanceKm,
      listingSlug: linked?.slug ?? null,
    });
  }

  const nearby = [...nearbyMap.values()]
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 24);

  return NextResponse.json({
    center: geo,
    sales: nearby,
  });
}
