import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { haversineKm } from "@/lib/geo-distance";
import { geocodePropertyAddress } from "@/lib/geocode";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const address = String(body.address || "").trim();
  const radiusKm = Number(body.radiusKm || 3);

  if (address.length < 5) {
    return NextResponse.json({ error: "Enter a fuller street address." }, { status: 400 });
  }

  const geo = await geocodePropertyAddress(address);
  if (!geo) {
    return NextResponse.json(
      { error: "Couldn’t locate that address. Try adding suburb + Auckland." },
      { status: 404 }
    );
  }

  const sales = await prisma.sale.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    take: 500,
  });

  const listings = await prisma.listing.findMany({
    select: { id: true, slug: true, address: true },
  });
  const byId = new Map(listings.map((l) => [l.id, l.slug]));
  const byAddress = new Map(listings.map((l) => [l.address.toLowerCase(), l.slug]));

  const nearby = sales
    .map((sale) => {
      const distanceKm = haversineKm(
        geo.latitude,
        geo.longitude,
        sale.latitude as number,
        sale.longitude as number
      );
      return {
        id: sale.id,
        address: sale.address,
        suburb: sale.suburb,
        soldPriceCents: sale.soldPriceCents,
        soldDate: sale.soldDate?.toISOString() ?? null,
        distanceKm,
        listingSlug:
          (sale.listingId && byId.get(sale.listingId)) ||
          byAddress.get(sale.address.toLowerCase()) ||
          null,
      };
    })
    .filter((s) => s.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 24);

  return NextResponse.json({
    center: geo,
    sales: nearby,
  });
}
