import { prisma } from "@/lib/db";
import type { AdminListingStatus } from "@/lib/listing-status";
import { revalidateListingPages } from "@/lib/revalidate-listings";

export const listingAdminSelect = {
  id: true,
  slug: true,
  address: true,
  title: true,
  suburb: true,
  bedrooms: true,
  bathrooms: true,
  latitude: true,
  longitude: true,
  sourceUrl: true,
} as const;

export function listingStatusFields(
  listing: { address: string; title: string },
  status: AdminListingStatus
) {
  const offMarket = status === "SOLD" || status === "WITHDRAWN";
  return {
    status,
    featured: status === "FOR_SALE",
    listedPriceLabel: offMarket ? null : undefined,
    auctionAt: offMarket ? null : undefined,
    auctionLocation: offMarket ? null : undefined,
    soldDate: status === "SOLD" ? new Date() : undefined,
    seoTitle: `${listing.address || listing.title} | ${
      status === "SOLD"
        ? "Sold"
        : status === "WITHDRAWN"
          ? "Withdrawn"
          : "For sale"
    } with Drew Miller`,
  };
}

export async function applyAdminListingStatus(
  listing: {
    id: string;
    slug: string;
    address: string;
    title: string;
    suburb: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    latitude: number | null;
    longitude: number | null;
    sourceUrl: string | null;
  },
  status: AdminListingStatus
) {
  await prisma.listing.update({
    where: { id: listing.id },
    data: listingStatusFields(listing, status),
  });

  if (status === "SOLD" || status === "WITHDRAWN") {
    await prisma.listingOpenHome.deleteMany({
      where: { listingId: listing.id },
    });
  }

  if (status === "SOLD") {
    const existingSale = await prisma.sale.findFirst({
      where: { listingId: listing.id },
      select: { id: true },
    });
    if (!existingSale) {
      await prisma.sale.create({
        data: {
          address: listing.address,
          suburb: listing.suburb,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          latitude: listing.latitude,
          longitude: listing.longitude,
          sourceUrl: listing.sourceUrl,
          listingId: listing.id,
          soldDate: new Date(),
          notes: "Marked sold in admin",
        },
      });
    }
  }

  try {
    revalidateListingPages(listing.slug);
  } catch {
    /* CLI / background — pages are force-dynamic */
  }
}
