import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Row = {
  rwId: string;
  address: string;
  suburb: string;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  floorArea?: string | null;
  coverImageUrl: string;
  sourceUrl: string;
};

function slugify(row: Row) {
  return `for-sale-${row.address}-${row.suburb}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const file = path.join(__dirname, "../data/current-listings.json");
  const rows = JSON.parse(readFileSync(file, "utf8")) as Row[];

  // Clear previous current-listing imports (keep sold archive intact)
  await prisma.listingImage.deleteMany({
    where: { listing: { importSource: "raywhite-current" } },
  });
  await prisma.listing.deleteMany({ where: { importSource: "raywhite-current" } });

  for (const row of rows) {
    const slug = slugify(row);
    const title = `${row.address}, ${row.suburb}`;
    await prisma.listing.create({
      data: {
        slug,
        title,
        address: `${row.address}, ${row.suburb}`,
        suburb: row.suburb,
        status: "FOR_SALE",
        summary: row.floorArea
          ? `Currently for sale · ${row.floorArea}`
          : "Currently for sale with Drew Miller, Ray White Mairangi Bay.",
        bedrooms: row.bedrooms ?? null,
        bathrooms: row.bathrooms ?? null,
        parking: row.parking ?? null,
        coverImageUrl: row.coverImageUrl,
        sourceUrl: row.sourceUrl,
        importSource: "raywhite-current",
        listedPriceLabel: "Contact agent",
        seoTitle: `${title} | For sale with Drew Miller`,
        seoDescription: `View ${title} — current listing with Ray White Elite agent Drew Miller.`,
        published: true,
        featured: true,
        images: {
          create: [
            {
              url: row.coverImageUrl,
              alt: title,
              sortOrder: 0,
            },
          ],
        },
      },
    });
    console.log("✓", title);
  }

  await prisma.siteSettings.update({
    where: { id: "default" },
    data: {
      phone: "021 963 654",
      email: "drew.miller@raywhite.com",
      agencyName: "Ray White Mairangi Bay & Milford",
    },
  });

  console.log(`Imported ${rows.length} current listings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
