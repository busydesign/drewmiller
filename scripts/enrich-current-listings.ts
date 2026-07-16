/**
 * Fetch full Ray White listing content + gallery for each current listing.
 *
 * Usage: npx tsx scripts/enrich-current-listings.ts
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

type SeedRow = {
  rwId: string;
  address: string;
  suburb: string;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  floorArea?: string | null;
  sourceUrl: string;
};

type ParsedListing = {
  sourceUrl: string;
  rwId: string;
  headline: string;
  priceLabel: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  propertyType: string | null;
  buildingArea: string | null;
  landArea: string | null;
  bodyHtml: string;
  bodyMarkdown: string;
  coverImageUrl: string | null;
  images: string[];
  latitude: number | null;
  longitude: number | null;
};

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<\/?sup>/gi, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function cleanText(s: string) {
  return decodeEntities(s).replace(/\s+/g, " ").trim();
}

function stripTags(html: string) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function meta(html: string, prop: string) {
  const re1 = new RegExp(
    `<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`,
    "i"
  );
  const m = html.match(re1) || html.match(re2);
  return m?.[1] ? decodeEntities(m[1]) : null;
}

function parseListingHtml(html: string, sourceUrl: string, rwId: string, seed: SeedRow): ParsedListing {
  const headline =
    cleanText(
      (html.match(
        /<h2[^>]*class="[^"]*property-detail__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i
      )?.[1] || "").replace(/<[^>]+>/g, "")
    ) || seed.address;

  const richHtml =
    html.match(
      /<div class="property-detail__body">[\s\S]*?<div class="rich-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    )?.[1]?.trim() || "";

  const bodyHtml = richHtml;
  const bodyMarkdown = stripTags(bodyHtml || meta(html, "og:description") || "");

  const priceLabel =
    cleanText(
      html.match(
        /property-detail__banner__side__price">\s*([^<]+)/i
      )?.[1] || ""
    ) || "Contact agent";

  const metaCount = (icon: string) => {
    const re = new RegExp(
      `icon-solid-${icon}[\\s\\S]{0,200}?property-meta__item__count">\\s*(\\d+)`,
      "i"
    );
    const n = Number(html.match(re)?.[1] || "");
    return Number.isFinite(n) ? n : null;
  };

  const bedrooms = metaCount("bed") ?? seed.bedrooms ?? null;
  const bathrooms = metaCount("bath") ?? seed.bathrooms ?? null;
  const parking = metaCount("car") ?? seed.parking ?? null;

  const labels = [
    ...(html.matchAll(
      /property-detail__banner__specs__item__label[^>]*>([\s\S]*?)<\/div>/gi
    ) || []),
  ].map((m) => cleanText(m[1]));
  const values = [
    ...(html.matchAll(
      /property-detail__banner__specs__item__value[^>]*>([\s\S]*?)<\/div>/gi
    ) || []),
  ].map((m) => cleanText(m[1]));

  const specMap = new Map<string, string>();
  labels.forEach((label, i) => {
    if (values[i]) specMap.set(label.toLowerCase(), values[i]);
  });

  const propertyType = specMap.get("property type") || "House";
  const buildingArea = specMap.get("building") || null;
  const landArea = specMap.get("land") || seed.floorArea || null;

  const images = [
    ...new Set(
      (html.match(/https:\/\/cdn6\.ep\.dynamics\.net\/s3\/rw-propertyimages\/[^"'?\s]+/g) ||
        []
      ).map((u) => u.replace(/&amp;/g, "&"))
    ),
  ];

  const coverImageUrl =
    (meta(html, "og:image") || images[0] || "").split("?")[0] || null;

  const coord = html.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/i);

  return {
    sourceUrl,
    rwId,
    headline,
    priceLabel,
    bedrooms,
    bathrooms,
    parking,
    propertyType,
    buildingArea,
    landArea,
    bodyHtml:
      bodyHtml ||
      `<p>${bodyMarkdown.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`,
    bodyMarkdown,
    coverImageUrl,
    images,
    latitude: coord ? Number(coord[1]) : null,
    longitude: coord ? Number(coord[2]) : null,
  };
}

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-NZ,en;q=0.9",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  if (html.length < 5000) throw new Error(`Unexpected short response for ${url}`);
  return html;
}

function slugify(address: string, suburb: string) {
  return `for-sale-${address}-${suburb}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const seedPath = path.join(__dirname, "../data/current-listings.json");
  const seed = JSON.parse(readFileSync(seedPath, "utf8")) as SeedRow[];
  const enriched: Array<ParsedListing & { address: string; suburb: string }> = [];

  for (const row of seed) {
    process.stdout.write(`Fetching ${row.rwId}… `);
    const html = await fetchHtml(row.sourceUrl);
    const parsed = parseListingHtml(html, row.sourceUrl, row.rwId, row);
    enriched.push({ ...parsed, address: row.address, suburb: row.suburb });
    console.log(
      `${parsed.images.length} imgs · ${parsed.bedrooms ?? "?"}bed/${parsed.bathrooms ?? "?"}bath · ${parsed.priceLabel}`
    );
    await new Promise((r) => setTimeout(r, 350));
  }

  writeFileSync(
    path.join(__dirname, "../data/current-listings.enriched.json"),
    JSON.stringify(enriched, null, 2)
  );

  await prisma.listingImage.deleteMany({
    where: { listing: { importSource: "raywhite-current" } },
  });
  await prisma.listing.deleteMany({ where: { importSource: "raywhite-current" } });

  for (const row of enriched) {
    const slug = slugify(row.address, row.suburb);
    const specs = [
      row.buildingArea ? `Building ${row.buildingArea}` : null,
      row.landArea ? `Land ${row.landArea}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    await prisma.listing.create({
      data: {
        slug,
        title: `${row.address}, ${row.suburb}`,
        address: `${row.address}, ${row.suburb}`,
        suburb: row.suburb,
        status: "FOR_SALE",
        summary: [row.headline, row.priceLabel, specs].filter(Boolean).join(" · "),
        bodyMarkdown: row.bodyMarkdown,
        bodyHtml: row.bodyHtml,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        parking: row.parking,
        propertyType: row.propertyType,
        listedPriceLabel: row.priceLabel,
        coverImageUrl: row.coverImageUrl,
        sourceUrl: row.sourceUrl,
        importSource: "raywhite-current",
        latitude: row.latitude,
        longitude: row.longitude,
        seoTitle: `${row.address}, ${row.suburb} | For sale with Drew Miller`,
        seoDescription: row.bodyMarkdown.slice(0, 160).replace(/\s+/g, " "),
        published: true,
        featured: true,
        images: {
          create: row.images.slice(0, 60).map((url, sortOrder) => ({
            url,
            alt: `${row.address}, ${row.suburb}`,
            sortOrder,
          })),
        },
      },
    });
  }

  console.log(`\nEnriched & imported ${enriched.length} current listings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
