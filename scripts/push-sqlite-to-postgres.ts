/**
 * One-shot: copy data from local prisma/dev.db (SQLite) into DATABASE_URL (Postgres).
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/push-sqlite-to-postgres.ts
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import {
  ListingStatus,
  PageKind,
  PrismaClient,
  type Prisma,
} from "@prisma/client";

type ListingRow = Prisma.ListingCreateManyInput;

const sqlitePath =
  process.env.SQLITE_PATH || path.join(process.cwd(), "prisma", "dev.db");

const sqlite = new DatabaseSync(sqlitePath);
const prisma = new PrismaClient();

function rows<T>(sql: string): T[] {
  return sqlite.prepare(sql).all() as T[];
}

function asDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function asBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

async function main() {
  console.log(`Reading ${sqlitePath}`);
  console.log(`Writing ${process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ":***@")}`);

  const settings = rows<Record<string, unknown>>(`SELECT * FROM SiteSettings`);
  for (const row of settings) {
    await prisma.siteSettings.upsert({
      where: { id: String(row.id) },
      create: {
        id: String(row.id),
        siteName: String(row.siteName),
        tagline: String(row.tagline),
        agentName: String(row.agentName),
        agencyName: String(row.agencyName),
        phone: (row.phone as string) ?? null,
        email: (row.email as string) ?? null,
        rateMyAgentUrl: String(row.rateMyAgentUrl),
        rmaRatingLabel: (row.rmaRatingLabel as string) ?? null,
        rmaReviewCount: (row.rmaReviewCount as number) ?? null,
        bio: (row.bio as string) ?? null,
        heroImageUrl: (row.heroImageUrl as string) ?? null,
        aboutMarkdown: (row.aboutMarkdown as string) ?? null,
      },
      update: {
        siteName: String(row.siteName),
        tagline: String(row.tagline),
        agentName: String(row.agentName),
        agencyName: String(row.agencyName),
        phone: (row.phone as string) ?? null,
        email: (row.email as string) ?? null,
        rateMyAgentUrl: String(row.rateMyAgentUrl),
        rmaRatingLabel: (row.rmaRatingLabel as string) ?? null,
        rmaReviewCount: (row.rmaReviewCount as number) ?? null,
        bio: (row.bio as string) ?? null,
        heroImageUrl: (row.heroImageUrl as string) ?? null,
        aboutMarkdown: (row.aboutMarkdown as string) ?? null,
      },
    });
  }
  console.log(`SiteSettings: ${settings.length}`);

  const admins = rows<Record<string, unknown>>(`SELECT * FROM AdminUser`);
  for (const row of admins) {
    await prisma.adminUser.upsert({
      where: { email: String(row.email) },
      create: {
        id: String(row.id),
        email: String(row.email),
        name: String(row.name),
        passwordHash: String(row.passwordHash),
        createdAt: asDate(row.createdAt) ?? undefined,
        updatedAt: asDate(row.updatedAt) ?? new Date(),
      },
      update: {
        name: String(row.name),
        passwordHash: String(row.passwordHash),
      },
    });
  }
  console.log(`AdminUser: ${admins.length}`);

  const agents = rows<Record<string, unknown>>(`SELECT * FROM Agent`);
  for (const row of agents) {
    await prisma.agent.upsert({
      where: { id: String(row.id) },
      create: {
        id: String(row.id),
        slug: String(row.slug),
        name: String(row.name),
        role: (row.role as string) ?? null,
        email: (row.email as string) ?? null,
        phone: (row.phone as string) ?? null,
        photoUrl: (row.photoUrl as string) ?? null,
        bioHtml: (row.bioHtml as string) ?? null,
        bioMarkdown: (row.bioMarkdown as string) ?? null,
        sourceUrl: (row.sourceUrl as string) ?? null,
        rwMemberId: (row.rwMemberId as number) ?? null,
        rwUsername: (row.rwUsername as string) ?? null,
        isLead: asBool(row.isLead),
        sortOrder: Number(row.sortOrder ?? 0),
        published: asBool(row.published),
        createdAt: asDate(row.createdAt) ?? undefined,
        updatedAt: asDate(row.updatedAt) ?? new Date(),
      },
      update: {
        slug: String(row.slug),
        name: String(row.name),
        role: (row.role as string) ?? null,
        email: (row.email as string) ?? null,
        phone: (row.phone as string) ?? null,
        photoUrl: (row.photoUrl as string) ?? null,
        bioHtml: (row.bioHtml as string) ?? null,
        bioMarkdown: (row.bioMarkdown as string) ?? null,
        sourceUrl: (row.sourceUrl as string) ?? null,
        rwMemberId: (row.rwMemberId as number) ?? null,
        rwUsername: (row.rwUsername as string) ?? null,
        isLead: asBool(row.isLead),
        sortOrder: Number(row.sortOrder ?? 0),
        published: asBool(row.published),
      },
    });
  }
  console.log(`Agent: ${agents.length}`);

  const listings = rows<Record<string, unknown>>(`SELECT * FROM Listing`);
  const listingData: ListingRow[] = listings.map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    address: String(row.address),
    suburb: (row.suburb as string) ?? null,
    city: String(row.city ?? "Auckland"),
    status: String(row.status) as ListingStatus,
    summary: (row.summary as string) ?? null,
    bodyMarkdown: (row.bodyMarkdown as string) ?? null,
    bodyHtml: (row.bodyHtml as string) ?? null,
    bedrooms: (row.bedrooms as number) ?? null,
    bathrooms: (row.bathrooms as number) ?? null,
    parking: (row.parking as number) ?? null,
    propertyType: (row.propertyType as string) ?? null,
    soldPriceCents: (row.soldPriceCents as number) ?? null,
    soldDate: asDate(row.soldDate),
    listedAt: asDate(row.listedAt),
    listedPriceLabel: (row.listedPriceLabel as string) ?? null,
    coverImageUrl: (row.coverImageUrl as string) ?? null,
    latitude: (row.latitude as number) ?? null,
    longitude: (row.longitude as number) ?? null,
    sourceUrl: (row.sourceUrl as string) ?? null,
    importSource: (row.importSource as string) ?? null,
    externalId: (row.externalId as string) ?? null,
    leadAgentId: (row.leadAgentId as string) ?? null,
    seoTitle: (row.seoTitle as string) ?? null,
    seoDescription: (row.seoDescription as string) ?? null,
    published: asBool(row.published),
    featured: asBool(row.featured),
    legacyCategory: (row.legacyCategory as string) ?? null,
    createdAt: asDate(row.createdAt) ?? undefined,
    updatedAt: asDate(row.updatedAt) ?? new Date(),
  }));

  // Clear dependent tables for idempotent re-runs
  await prisma.listingAgent.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.listing.createMany({ data: listingData });
  console.log(`Listing: ${listingData.length}`);

  const images = rows<Record<string, unknown>>(`SELECT * FROM ListingImage`);
  if (images.length) {
    await prisma.listingImage.createMany({
      data: images.map((row) => ({
        id: String(row.id),
        listingId: String(row.listingId),
        url: String(row.url),
        alt: (row.alt as string) ?? null,
        sortOrder: Number(row.sortOrder ?? 0),
      })),
    });
  }
  console.log(`ListingImage: ${images.length}`);

  const links = rows<Record<string, unknown>>(`SELECT * FROM ListingAgent`);
  if (links.length) {
    await prisma.listingAgent.createMany({
      data: links.map((row) => ({
        listingId: String(row.listingId),
        agentId: String(row.agentId),
        isLead: asBool(row.isLead),
        sortOrder: Number(row.sortOrder ?? 0),
      })),
    });
  }
  console.log(`ListingAgent: ${links.length}`);

  const sales = rows<Record<string, unknown>>(`SELECT * FROM Sale`);
  await prisma.sale.deleteMany();
  if (sales.length) {
    await prisma.sale.createMany({
      data: sales.map((row) => ({
        id: String(row.id),
        address: String(row.address),
        suburb: (row.suburb as string) ?? null,
        propertyType: (row.propertyType as string) ?? null,
        bedrooms: (row.bedrooms as number) ?? null,
        bathrooms: (row.bathrooms as number) ?? null,
        soldPriceCents: (row.soldPriceCents as number) ?? null,
        soldDate: asDate(row.soldDate),
        latitude: (row.latitude as number) ?? null,
        longitude: (row.longitude as number) ?? null,
        sourceUrl: (row.sourceUrl as string) ?? null,
        listingId: (row.listingId as string) ?? null,
        notes: (row.notes as string) ?? null,
        createdAt: asDate(row.createdAt) ?? undefined,
        updatedAt: asDate(row.updatedAt) ?? new Date(),
      })),
    });
  }
  console.log(`Sale: ${sales.length}`);

  const pages = rows<Record<string, unknown>>(`SELECT * FROM ContentPage`);
  for (const row of pages) {
    await prisma.contentPage.upsert({
      where: { slug: String(row.slug) },
      create: {
        id: String(row.id),
        slug: String(row.slug),
        kind: String(row.kind) as PageKind,
        title: String(row.title),
        summary: (row.summary as string) ?? null,
        bodyMarkdown: (row.bodyMarkdown as string) ?? null,
        bodyHtml: (row.bodyHtml as string) ?? null,
        coverImageUrl: (row.coverImageUrl as string) ?? null,
        seoTitle: (row.seoTitle as string) ?? null,
        seoDescription: (row.seoDescription as string) ?? null,
        published: asBool(row.published),
        publishedAt: asDate(row.publishedAt),
        createdAt: asDate(row.createdAt) ?? undefined,
        updatedAt: asDate(row.updatedAt) ?? new Date(),
      },
      update: {
        kind: String(row.kind) as PageKind,
        title: String(row.title),
        summary: (row.summary as string) ?? null,
        bodyMarkdown: (row.bodyMarkdown as string) ?? null,
        bodyHtml: (row.bodyHtml as string) ?? null,
        coverImageUrl: (row.coverImageUrl as string) ?? null,
        seoTitle: (row.seoTitle as string) ?? null,
        seoDescription: (row.seoDescription as string) ?? null,
        published: asBool(row.published),
        publishedAt: asDate(row.publishedAt),
      },
    });
  }
  console.log(`ContentPage: ${pages.length}`);

  const testimonials = rows<Record<string, unknown>>(`SELECT * FROM Testimonial`);
  for (const row of testimonials) {
    await prisma.testimonial.upsert({
      where: { slug: String(row.slug) },
      create: {
        id: String(row.id),
        slug: String(row.slug),
        clientName: String(row.clientName),
        propertyLabel: (row.propertyLabel as string) ?? null,
        quote: String(row.quote),
        bodyMarkdown: (row.bodyMarkdown as string) ?? null,
        rating: (row.rating as number) ?? null,
        sourceUrl: (row.sourceUrl as string) ?? null,
        published: asBool(row.published),
        sortOrder: Number(row.sortOrder ?? 0),
        createdAt: asDate(row.createdAt) ?? undefined,
        updatedAt: asDate(row.updatedAt) ?? new Date(),
      },
      update: {
        clientName: String(row.clientName),
        propertyLabel: (row.propertyLabel as string) ?? null,
        quote: String(row.quote),
        bodyMarkdown: (row.bodyMarkdown as string) ?? null,
        rating: (row.rating as number) ?? null,
        sourceUrl: (row.sourceUrl as string) ?? null,
        published: asBool(row.published),
        sortOrder: Number(row.sortOrder ?? 0),
      },
    });
  }
  console.log(`Testimonial: ${testimonials.length}`);

  const leads = rows<Record<string, unknown>>(`SELECT * FROM AppraisalLead`);
  await prisma.appraisalLead.deleteMany();
  if (leads.length) {
    await prisma.appraisalLead.createMany({
      data: leads.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        phone: (row.phone as string) ?? null,
        address: String(row.address),
        message: (row.message as string) ?? null,
        source: (row.source as string) ?? null,
        createdAt: asDate(row.createdAt) ?? undefined,
      })),
    });
  }
  console.log(`AppraisalLead: ${leads.length}`);

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    sqlite.close();
    await prisma.$disconnect();
  });
