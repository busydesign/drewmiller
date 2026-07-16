import type { Metadata } from "next";
import {
  SoldListingsSearch,
  type SoldListingCardData,
} from "@/components/SoldListingsSearch";
import { prisma } from "@/lib/db";
import { pickCoverImage } from "@/lib/listing-images";
import { agentsForCard, listingCardInclude } from "@/lib/listings-query";

export const metadata: Metadata = {
  title: "Sold properties",
  description:
    "Browse Drew Miller’s sold property pages across Auckland’s North Shore — preserved for SEO and proof of results.",
};

export default async function SoldPage() {
  const listings = await prisma.listing.findMany({
    where: { published: true, status: "SOLD" },
    orderBy: [{ suburb: "asc" }, { address: "asc" }],
    include: {
      ...listingCardInclude,
      images: {
        select: { url: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const cards: SoldListingCardData[] = listings.map((listing) => ({
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    address: listing.address,
    suburb: listing.suburb,
    coverImageUrl: pickCoverImage(
      listing.coverImageUrl,
      listing.images.map((image) => image.url)
    ),
    soldPriceCents: listing.soldPriceCents,
    soldDate: listing.soldDate?.toISOString() ?? null,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    agents: agentsForCard(listing),
  }));

  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow">Archive</p>
        <h1 className="display mt-2 text-5xl md:text-6xl">Sold properties</h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          Search the full sold archive — same URL paths as the previous site,
          with a cleaner browsing experience.
        </p>
        <SoldListingsSearch listings={cards} />
      </div>
    </section>
  );
}
