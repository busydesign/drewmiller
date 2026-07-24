/**
 * Rewrite listing slugs that contain "/" (unit numbers) so they don't 404,
 * and print permanent redirects for next.config.ts.
 *
 * Usage: DATABASE_URL=... npx tsx scripts/fix-slash-slugs.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/slugify";

const prisma = new PrismaClient();

async function uniqueSlug(base: string, excludeId: string): Promise<string> {
  let slug = base;
  let i = 2;
  while (
    await prisma.listing.findFirst({
      where: { slug, NOT: { id: excludeId } },
      select: { id: true },
    })
  ) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

async function main() {
  const broken = await prisma.listing.findMany({
    where: { slug: { contains: "/" } },
    select: { id: true, slug: true, address: true, status: true },
    orderBy: { slug: "asc" },
  });

  if (broken.length === 0) {
    console.log("No slash slugs found.");
    return;
  }

  const redirects: Array<{ from: string; to: string }> = [];

  for (const row of broken) {
    const isForSale = ["FOR_SALE", "UNDER_OFFER", "COMING_SOON"].includes(
      row.status
    );
    let base = slugify(row.address);
    if (isForSale && !base.startsWith("for-sale-")) {
      base = `for-sale-${base}`;
    }
    const next = await uniqueSlug(base, row.id);
    await prisma.listing.update({
      where: { id: row.id },
      data: { slug: next },
    });
    redirects.push({ from: `/${row.slug}`, to: `/${next}` });
    console.log(`${row.slug}  →  ${next}`);
  }

  console.log("\n// Paste into next.config.ts redirects():");
  for (const r of redirects) {
    console.log(
      JSON.stringify(
        { source: r.from, destination: r.to, permanent: true },
        null,
        2
      ) + ","
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
