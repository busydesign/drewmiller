/**
 * Rewrite /migration-images/* paths to live Squarespace CDN URLs
 * using drewmiller-migration/export/inventory.json.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/rewrite-migration-image-urls.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const inventoryPath =
  process.env.MIGRATION_INVENTORY ||
  path.join(
    process.cwd(),
    "..",
    "drewmiller-migration",
    "export",
    "inventory.json"
  );

type InventoryImage = { url: string; path: string };

function buildMap() {
  const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as {
    images: InventoryImage[];
  };
  const map = new Map<string, string>();
  for (const image of inventory.images) {
    const filename = image.path.split("/").pop();
    if (filename) map.set(filename, image.url);
  }
  return map;
}

function rewrite(url: string | null | undefined, map: Map<string, string>) {
  if (!url || !url.includes("migration-images")) return null;
  const filename = url.split("/").pop()?.split("?")[0];
  if (!filename) return null;
  return map.get(filename) ?? null;
}

async function updateInBatches(
  prisma: PrismaClient,
  rows: Array<{ id: string; url: string }>,
  table: "ListingImage" | "ListingCover"
) {
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await prisma.$transaction(
      chunk.map((row) =>
        table === "ListingImage"
          ? prisma.listingImage.update({
              where: { id: row.id },
              data: { url: row.url },
            })
          : prisma.listing.update({
              where: { id: row.id },
              data: { coverImageUrl: row.url },
            })
      )
    );
    console.log(`  ${table}: ${Math.min(i + chunkSize, rows.length)}/${rows.length}`);
  }
}

async function main() {
  const map = buildMap();
  console.log(`Loaded ${map.size} CDN mappings from ${inventoryPath}`);

  const prisma = new PrismaClient();

  const listings = await prisma.listing.findMany({
    select: {
      id: true,
      coverImageUrl: true,
      bodyHtml: true,
    },
  });
  const images = await prisma.listingImage.findMany({
    select: { id: true, url: true },
  });

  const coverUpdates: Array<{ id: string; url: string }> = [];
  const bodyUpdates: Array<{ id: string; bodyHtml: string }> = [];
  let missed = 0;

  for (const listing of listings) {
    const nextCover = rewrite(listing.coverImageUrl, map);
    if (nextCover) coverUpdates.push({ id: listing.id, url: nextCover });
    else if (listing.coverImageUrl?.includes("migration-images")) missed += 1;

    if (listing.bodyHtml?.includes("migration-images")) {
      const nextBody = listing.bodyHtml.replace(
        /\/migration-images\/([^"'\\s>]+)/g,
        (full, filename: string) => map.get(filename) ?? full
      );
      if (nextBody !== listing.bodyHtml) {
        bodyUpdates.push({ id: listing.id, bodyHtml: nextBody });
      }
    }
  }

  const galleryUpdates: Array<{ id: string; url: string }> = [];
  for (const image of images) {
    const nextUrl = rewrite(image.url, map);
    if (nextUrl) galleryUpdates.push({ id: image.id, url: nextUrl });
    else if (image.url.includes("migration-images")) missed += 1;
  }

  console.log(
    `Prepared covers=${coverUpdates.length}, gallery=${galleryUpdates.length}, bodies=${bodyUpdates.length}`
  );

  await updateInBatches(prisma, coverUpdates, "ListingCover");
  await updateInBatches(prisma, galleryUpdates, "ListingImage");

  const bodyChunk = 50;
  for (let i = 0; i < bodyUpdates.length; i += bodyChunk) {
    const chunk = bodyUpdates.slice(i, i + bodyChunk);
    await prisma.$transaction(
      chunk.map((row) =>
        prisma.listing.update({
          where: { id: row.id },
          data: { bodyHtml: row.bodyHtml },
        })
      )
    );
    console.log(
      `  bodies: ${Math.min(i + bodyChunk, bodyUpdates.length)}/${bodyUpdates.length}`
    );
  }

  console.log(`Done. unmatched=${missed}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
