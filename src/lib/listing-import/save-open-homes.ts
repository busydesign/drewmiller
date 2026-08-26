import { prisma } from "@/lib/db";
import type { ParsedAuction, ParsedOpenHome } from "@/lib/listing-import/parse-inspections";

export async function replaceImportedOpenHomes(
  listingId: string,
  homes: ParsedOpenHome[]
) {
  await prisma.listingOpenHome.deleteMany({
    where: { listingId, source: "IMPORT" },
  });
  if (homes.length === 0) return;
  await prisma.listingOpenHome.createMany({
    data: homes.map((home) => ({
      listingId,
      startsAt: home.startsAt,
      endsAt: home.endsAt,
      source: "IMPORT" as const,
    })),
  });
}

export async function applyListingCampaignTimes(
  listingId: string,
  opts: {
    isCurrent: boolean;
    openHomes: ParsedOpenHome[];
    auction: ParsedAuction | null;
  }
) {
  if (!opts.isCurrent) {
    await prisma.listingOpenHome.deleteMany({ where: { listingId } });
    await prisma.listing.update({
      where: { id: listingId },
      data: { auctionAt: null, auctionLocation: null },
    });
    return;
  }

  await replaceImportedOpenHomes(listingId, opts.openHomes);
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      auctionAt: opts.auction?.auctionAt ?? null,
      auctionLocation: opts.auction?.auctionLocation ?? null,
    },
  });
}
