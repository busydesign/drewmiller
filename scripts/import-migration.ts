/**
 * Import Squarespace export + RateMyAgent sales into the local DB.
 *
 * Usage: npx tsx scripts/import-migration.ts
 */
import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { PrismaClient, ListingStatus, PageKind } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const ROOT = path.resolve(__dirname, "..");
const MIGRATION =
  process.env.MIGRATION_EXPORT ||
  path.resolve(ROOT, "../drewmiller-migration/export");

type InvPage = {
  url: string;
  slug: string;
  title?: string;
  description?: string;
  category?: string;
  status_code?: number;
  images?: string[];
  export_path?: string;
};

function slugFromUrl(url: string): string {
  try {
    const p = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
    return decodeURIComponent(p || "home");
  } catch {
    return "home";
  }
}

function titleToAddress(title: string, slug: string): string {
  const cleaned = title
    .replace(/\s*[|\-–—]\s*North Shore.*$/i, "")
    .replace(/\s*[|\-–—]\s*Drew Miller.*$/i, "")
    .replace(/\s*[|\-–—]\s*Sales Index.*$/i, "")
    .trim();
  if (cleaned && !/^north shore/i.test(cleaned) && cleaned.length < 120) {
    return cleaned;
  }
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function guessSuburb(address: string, slug: string): string | null {
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) return parts[parts.length - 1] || null;
  const known = [
    "Mairangi Bay",
    "Browns Bay",
    "Torbay",
    "Milford",
    "Takapuna",
    "Devonport",
    "Birkenhead",
    "Birkdale",
    "Beach Haven",
    "Glenfield",
    "Forrest Hill",
    "Sunnynook",
    "Castor Bay",
    "Rothesay Bay",
    "Murray's Bay",
    "Murrays Bay",
    "Greenhithe",
    "Albany",
    "Bayview",
    "Hillcrest",
    "Northcote",
    "Pinehill",
    "Long Bay",
    "Waiake",
    "Campbells Bay",
  ];
  const hay = `${address} ${slug}`.toLowerCase();
  for (const s of known) {
    if (hay.includes(s.toLowerCase().replace(/'/g, ""))) return s;
  }
  return null;
}

function loadPageText(exportPath?: string): { md: string; html: string } {
  if (!exportPath) return { md: "", html: "" };
  const abs = path.resolve(path.dirname(MIGRATION), "..", exportPath);
  // export_path is like export/pages/about
  const candidates = [
    path.join(ROOT, "..", "drewmiller-migration", exportPath),
    path.join(MIGRATION, "pages", path.basename(exportPath)),
    abs,
  ];
  for (const dir of candidates) {
    const mdPath = path.join(dir, "content.md");
    const htmlPath = path.join(dir, "content.html");
    if (existsSync(mdPath) || existsSync(htmlPath)) {
      return {
        md: existsSync(mdPath) ? readFileSync(mdPath, "utf8") : "",
        html: existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "",
      };
    }
  }
  // inventory export_path relative to migration root
  const fromInv = path.join(
    path.dirname(MIGRATION),
    exportPath.replace(/^export\//, "export/")
  );
  const mdPath = path.join(MIGRATION.replace(/\/export$/, ""), exportPath, "content.md");
  // simpler: pages live at MIGRATION/pages/<slug>
  return { md: "", html: "" };
}

function loadPageContent(pageSlugEncoded: string, exportPath?: string) {
  const slugFolder = pageSlugEncoded; // inventory uses __ separators
  const dirs = [
    exportPath
      ? path.join(path.dirname(MIGRATION), exportPath)
      : "",
    path.join(MIGRATION, "pages", slugFolder),
  ].filter(Boolean);

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    const md = existsSync(path.join(dir, "content.md"))
      ? readFileSync(path.join(dir, "content.md"), "utf8")
      : "";
    const html = existsSync(path.join(dir, "content.html"))
      ? readFileSync(path.join(dir, "content.html"), "utf8")
      : "";
    let images: { url: string; local?: string }[] = [];
    const manifestPath = path.join(dir, "images-manifest.json");
    if (existsSync(manifestPath)) {
      const man = JSON.parse(readFileSync(manifestPath, "utf8"));
      images = (man.images || [])
        .filter((i: { status: string }) => i.status === "linked")
        .map((i: { url: string; filename?: string; local?: string }) => ({
          url: i.url,
          local: i.filename
            ? `/migration-images/${i.filename}`
            : i.local?.replace(/^images\//, "/migration-images/"),
        }));
    }
    return { md, html, images, dir };
  }
  return { md: "", html: "", images: [] as { url: string; local?: string }[], dir: "" };
}

function stripMdHeader(md: string): string {
  return md.replace(/^# .+\n+Source: .+\n+/m, "").trim();
}

async function main() {
  const invPath = path.join(MIGRATION, "inventory.json");
  if (!existsSync(invPath)) {
    throw new Error(`Missing inventory at ${invPath}`);
  }
  const inventory = JSON.parse(readFileSync(invPath, "utf8"));
  const pages = (inventory.pages || []) as InvPage[];

  console.log(`Importing from ${MIGRATION} (${pages.length} pages)`);

  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.contentPage.deleteMany();
  await prisma.testimonial.deleteMany();

  const adminEmail = process.env.ADMIN_EMAIL || "admin@drewmiller.co.nz";
  const adminPass = process.env.ADMIN_PASSWORD || "changeme";
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash: await bcrypt.hash(adminPass, 10) },
    create: {
      email: adminEmail,
      name: "Site Admin",
      passwordHash: await bcrypt.hash(adminPass, 10),
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      phone: "021 278 8855",
      email: "drew@drewmiller.co.nz",
      bio: "North Shore real estate specialist helping people buy and sell with clarity, negotiation strength, and local market insight.",
      rmaRatingLabel: "RateMyAgent",
    },
  });

  let listings = 0;
  let contentPages = 0;
  let testimonials = 0;

  for (const page of pages) {
    if (page.status_code && page.status_code !== 200) continue;
    const slug = slugFromUrl(page.url);
    if (!slug || slug === "home" || slug === "home-page") continue;

    const content = loadPageContent(page.slug, page.export_path);
    const md = stripMdHeader(content.md);
    const title = (page.title || slug).trim();

    if (page.category === "listing-or-case-study") {
      const address = titleToAddress(title, slug);
      const galleryLocals = content.images
        .map((i) => i.local || i.url)
        .filter(
          (url): url is string =>
            Boolean(url) &&
            !url.endsWith(".ico") &&
            !/(?:^|\/)(?:blue(?:_box)?_|Capture_|16cgatman_cb400054)/i.test(
              url
            )
        );
      const cover = galleryLocals[0] || null;

      const listing = await prisma.listing.create({
        data: {
          slug,
          title: address,
          address,
          suburb: guessSuburb(address, slug),
          status: ListingStatus.SOLD,
          summary: page.description || null,
          bodyMarkdown: md || null,
          bodyHtml: content.html || null,
          coverImageUrl: cover,
          sourceUrl: page.url,
          seoTitle: title,
          seoDescription: page.description || null,
          legacyCategory: page.category,
          published: true,
          images: {
            create: galleryLocals.slice(0, 40).map((url, idx) => ({
              url,
              alt: address,
              sortOrder: idx,
            })),
          },
        },
      });

      // Mirror into Sale table for map/comps when useful
      await prisma.sale.create({
        data: {
          address,
          suburb: listing.suburb,
          sourceUrl: page.url,
          listingId: listing.id,
          notes: "Imported from legacy Squarespace listing page",
        },
      });
      listings++;
      continue;
    }

    if (page.category === "testimonials" && slug.includes("/")) {
      // skip index; individual testimonials have deeper paths
    }

    if (page.category === "testimonials" && slug.startsWith("testimonials")) {
      const isIndex = slug === "testimonials" || slug === "testimonials-1";
      if (isIndex) {
        await prisma.contentPage.create({
          data: {
            slug,
            kind: PageKind.TESTIMONIAL,
            title,
            summary: page.description,
            bodyMarkdown: md || null,
            bodyHtml: content.html || null,
            seoTitle: title,
            seoDescription: page.description,
            published: true,
          },
        });
        contentPages++;
      } else {
        const clientName =
          title.split("-").pop()?.trim() ||
          title.replace(/testimonial/i, "").trim() ||
          "Client";
        await prisma.testimonial.create({
          data: {
            slug,
            clientName,
            propertyLabel: title,
            quote: md.slice(0, 500) || title,
            bodyMarkdown: md || null,
            sourceUrl: page.url,
            published: true,
            sortOrder: testimonials,
          },
        });
        testimonials++;
      }
      continue;
    }

    if (
      page.category === "core" ||
      page.category === "area-seo" ||
      page.category === "blog"
    ) {
      const kind =
        page.category === "blog"
          ? PageKind.BLOG
          : page.category === "area-seo"
            ? PageKind.AREA
            : PageKind.CORE;
      await prisma.contentPage.create({
        data: {
          slug,
          kind,
          title,
          summary: page.description,
          bodyMarkdown: md || null,
          bodyHtml: content.html || null,
          coverImageUrl:
            content.images.find((i) => i.local && !i.local.endsWith(".ico"))
              ?.local || null,
          seoTitle: title,
          seoDescription: page.description,
          published: true,
          publishedAt: page.category === "blog" ? new Date() : null,
        },
      });
      contentPages++;
    }
  }

  // RateMyAgent sales JSON
  const rmaPath = path.join(ROOT, "data/drew-miller-rma-sales.json");
  let rmaCount = 0;
  if (existsSync(rmaPath)) {
    const rma = JSON.parse(readFileSync(rmaPath, "utf8")) as Array<{
      address: string;
      suburb?: string;
      propertyType?: string;
      bedrooms?: number;
      bathrooms?: number;
      soldPriceDollars?: string;
      soldDate?: string;
      sourceUrl?: string;
    }>;
    for (const row of rma) {
      const dollars = Number(String(row.soldPriceDollars || "").replace(/[^\d.]/g, ""));
      await prisma.sale.create({
        data: {
          address: row.address,
          suburb: row.suburb || guessSuburb(row.address, ""),
          propertyType: row.propertyType,
          bedrooms: row.bedrooms ?? null,
          bathrooms: row.bathrooms ?? null,
          soldPriceCents: Number.isFinite(dollars) ? Math.round(dollars * 100) : null,
          soldDate: row.soldDate ? new Date(row.soldDate) : null,
          sourceUrl: row.sourceUrl,
          notes: "RateMyAgent",
        },
      });
      rmaCount++;
    }
  }

  console.log(
    JSON.stringify(
      {
        listings,
        contentPages,
        testimonials,
        rmaSales: rmaCount,
        admin: adminEmail,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
