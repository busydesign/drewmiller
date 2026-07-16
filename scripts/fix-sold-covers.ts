/**
 * Replace placeholder / screenshot covers with the first real gallery photo.
 * Also unpublish the Gatman testimonial-only duplicate page.
 *
 * Usage: npm run db:fix-sold-covers
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  isJunkMigrationImage,
  pickCoverImage,
} from "../src/lib/listing-images";

const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.listing.findMany({
    where: { published: true },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  let coversFixed = 0;
  let junkRemoved = 0;

  for (const listing of listings) {
    const galleryUrls = listing.images.map((i) => i.url);
    const nextCover = pickCoverImage(listing.coverImageUrl, galleryUrls);

    if (nextCover && nextCover !== listing.coverImageUrl) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { coverImageUrl: nextCover },
      });
      coversFixed++;
      console.log(`✓ cover ${listing.slug} → ${nextCover}`);
    } else if (!nextCover && isJunkMigrationImage(listing.coverImageUrl)) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { coverImageUrl: null },
      });
      coversFixed++;
      console.log(`× cleared junk cover ${listing.slug}`);
    }

    const junkImages = listing.images.filter((i) =>
      isJunkMigrationImage(i.url)
    );
    if (junkImages.length) {
      await prisma.listingImage.deleteMany({
        where: { id: { in: junkImages.map((i) => i.id) } },
      });
      junkRemoved += junkImages.length;
    }
  }

  // Testimonial screenshot page — keep URL out of archive grid
  const testimonialOnly = await prisma.listing.updateMany({
    where: { slug: "16cgatman" },
    data: { published: false },
  });

  // Enrich sparse Gatman slug with the fuller migrated gallery
  const primary = await prisma.listing.findUnique({
    where: { slug: "16c-gatman" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  const sparse = await prisma.listing.findUnique({
    where: { slug: "16c-gatman-street" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  if (primary && sparse && primary.images.length > sparse.images.length) {
    const existing = new Set(sparse.images.map((i) => i.url));
    const toAdd = primary.images
      .filter((i) => !isJunkMigrationImage(i.url) && !existing.has(i.url))
      .map((i, idx) => ({
        listingId: sparse.id,
        url: i.url,
        alt: sparse.address,
        sortOrder: sparse.images.length + idx,
      }));
    if (toAdd.length) {
      await prisma.listingImage.createMany({ data: toAdd });
      console.log(
        `✓ copied ${toAdd.length} gallery images → 16c-gatman-street`
      );
    }
    const cover = pickCoverImage(
      sparse.coverImageUrl,
      [...sparse.images.map((i) => i.url), ...toAdd.map((i) => i.url)]
    );
    if (cover && cover !== sparse.coverImageUrl) {
      await prisma.listing.update({
        where: { id: sparse.id },
        data: { coverImageUrl: cover },
      });
    }
  }

  console.log(
    `\nDone. covers fixed: ${coversFixed}, junk images removed: ${junkRemoved}, unpublished testimonial pages: ${testimonialOnly.count}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
