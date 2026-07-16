/**
 * Sync current listings for Drew’s full team from Ray White Mairangi Bay API.
 * Assigns leadAgent from the first listed agent on each property.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { decodeHtmlEntities } from "../src/lib/listing-import/decode-html";
import { TEAM_MEMBER_IDS } from "../src/lib/team";

const prisma = new PrismaClient();
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const API = "https://rwmairangibay.co.nz/api/proxy/v1";

type ApiAgent = {
  memberId?: number;
  fullName?: string;
};

type ApiListing = {
  id: number;
  sourceId?: string;
  title?: string;
  description?: string;
  displayPrice?: string;
  bedrooms?: number;
  bathrooms?: number;
  carSpaces?: number;
  status?: string;
  statusCode?: string;
  underOffer?: boolean;
  creationTime?: string;
  updatedAt?: string;
  address?: {
    unitNumber?: string;
    streetNumber?: string;
    streetName?: string;
    streetType?: string;
    suburb?: string;
    region?: string;
    location?: { lat?: number; lon?: number };
    formatted?: string;
  };
  images?: Array<{ url?: string }>;
  measurements?: Array<{ code?: string; name?: string; value?: number }>;
  categories?: Array<{ category?: string }>;
  agents?: ApiAgent[];
  links?: Array<{ url?: string; code?: string }>;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function stripTags(html: string) {
  return decodeHtmlEntities(
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

function titleCase(value?: string | null) {
  if (!value) return "";
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAddress(address?: ApiListing["address"] & { unitNumber?: string }) {
  if (!address) return "";

  // First line of formatted address includes unit numbers (e.g. 2/8 Park Rise)
  const streetFromFormatted = address.formatted
    ?.split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  const street =
    streetFromFormatted ||
    [
      address.unitNumber && address.streetNumber
        ? `${address.unitNumber}/${address.streetNumber}`
        : address.streetNumber,
      address.streetName,
      address.streetType,
    ]
      .filter(Boolean)
      .join(" ");

  const suburb = titleCase(address.suburb);
  const region = titleCase(address.region);
  const locality = [suburb, region].filter(Boolean).join(", ");
  return [street, locality].filter(Boolean).join(", ");
}

function formatArea(value: number, hint: string) {
  if (/land/i.test(hint) && value >= 10000) {
    const ha = value / 10000;
    return `${Number.isInteger(ha) ? ha : ha.toFixed(2)} ha`;
  }
  return `${value} m2`;
}

function measurement(
  rows: ApiListing["measurements"],
  code: string
): string | null {
  const row = rows?.find((r) => r.code === code && r.value != null);
  if (!row?.value) return null;
  return formatArea(row.value, row.name || code);
}

async function fetchMemberListings(
  memberId: number,
  statusCode: "CUR" | "SLD"
): Promise<ApiListing[]> {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const url = `${API}/listings?rpp=50&q=memberId:${memberId}&statusCode=${statusCode}&listingStateCode=ACT`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      Referer: "https://rwmairangibay.co.nz/",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Listings API ${res.status} for ${memberId}`);
  const json = (await res.json()) as { data?: Array<{ value?: ApiListing }> };
  return (json.data || [])
    .map((row) => row.value)
    .filter((v): v is ApiListing => Boolean(v?.id))
    .filter((v) =>
      (v.agents || []).some((a) => a.memberId === memberId)
    );
}

async function main() {
  const agents = await prisma.agent.findMany({
    where: { rwMemberId: { in: [...TEAM_MEMBER_IDS] } },
  });
  const byMemberId = new Map(
    agents.filter((a) => a.rwMemberId != null).map((a) => [a.rwMemberId!, a])
  );
  if (byMemberId.size === 0) {
    throw new Error("No team agents in DB — run npm run db:seed-team first");
  }

  const listings = new Map<number, ApiListing>();
  for (const memberId of TEAM_MEMBER_IDS) {
    const current = await fetchMemberListings(memberId, "CUR");
    const sold = await fetchMemberListings(memberId, "SLD");
    console.log(
      `member ${memberId}: ${current.length} current, ${sold.length} sold`
    );
    for (const row of [...current, ...sold]) listings.set(row.id, row);
  }

  let created = 0;
  let updated = 0;

  for (const listing of listings.values()) {
    const address = formatAddress(listing.address) || listing.title || "Listing";
    const externalId = listing.sourceId || `rw:${listing.id}`;
    const leadMemberId = listing.agents?.[0]?.memberId ?? null;
    const teamAgents = (listing.agents || [])
      .map((a, index) => {
        if (a.memberId == null) return null;
        const agent = byMemberId.get(a.memberId);
        if (!agent) return null;
        return {
          agent,
          index,
          isLead: a.memberId === leadMemberId,
        };
      })
      .filter(
        (
          row
        ): row is {
          agent: (typeof agents)[number];
          index: number;
          isLead: boolean;
        } => Boolean(row)
      );

    const leadAgent =
      teamAgents.find((a) => a.isLead)?.agent || teamAgents[0]?.agent || null;
    const headline = decodeHtmlEntities(listing.title || "").trim();
    const bodyHtml = (listing.description || "").trim();
    const bodyMarkdown = stripTags(bodyHtml);
    const listedPriceLabel =
      decodeHtmlEntities(listing.displayPrice || "").trim() || null;
    const building = measurement(listing.measurements, "BAS");
    const land = measurement(listing.measurements, "LAS");
    const galleryUrls = [
      ...new Set(
        (listing.images || [])
          .map((img) => img.url?.split("?")[0])
          .filter((u): u is string => Boolean(u))
      ),
    ];
    const shortUrl =
      listing.links?.find((l) => l.code === "PRL")?.url ||
      `https://rwmairangibay.co.nz/${externalId}`;
    const sourceUrl = shortUrl;
    const summary = [
      headline || null,
      listedPriceLabel,
      building ? `Building ${building}` : null,
      land ? `Land ${land}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const isSold =
      listing.statusCode === "SLD" || /sold/i.test(listing.status || "");
    const status = isSold
      ? "SOLD"
      : listing.underOffer
        ? "UNDER_OFFER"
        : "FOR_SALE";
    const listedAt = listing.creationTime
      ? new Date(listing.creationTime)
      : null;

    const streetHint = [
      listing.address?.streetNumber,
      listing.address?.streetName,
    ]
      .filter(Boolean)
      .join(" ");

    const existing =
      (await prisma.listing.findUnique({ where: { externalId } })) ||
      (await prisma.listing.findFirst({
        where: {
          OR: [
            { sourceUrl },
            { sourceUrl: { contains: externalId } },
            { sourceUrl: { contains: String(listing.id) } },
            ...(streetHint && !isSold
              ? [
                  {
                    address: { contains: streetHint },
                    status: {
                      in: ["FOR_SALE", "UNDER_OFFER", "COMING_SOON"] as Array<
                        "FOR_SALE" | "UNDER_OFFER" | "COMING_SOON"
                      >,
                    },
                  },
                ]
              : []),
          ],
        },
      }));

    let slug = existing?.slug;
    if (!slug) {
      let base = `${isSold ? "" : "for-sale-"}${slugify(address)}`.replace(
        /^-+/,
        ""
      );
      if (!isSold && !base.startsWith("for-sale-")) {
        base = `for-sale-${base}`;
      }
      slug = base;
      let i = 2;
      while (await prisma.listing.findUnique({ where: { slug } })) {
        slug = `${base}-${i++}`;
      }
    }

    const data = {
      slug,
      title: address,
      address,
      suburb: titleCase(listing.address?.suburb) || null,
      status: status as "FOR_SALE" | "UNDER_OFFER" | "SOLD",
      summary,
      bodyMarkdown: bodyMarkdown || null,
      bodyHtml: bodyHtml || null,
      coverImageUrl: galleryUrls[0] || null,
      bedrooms: listing.bedrooms ?? null,
      bathrooms: listing.bathrooms ?? null,
      parking: listing.carSpaces ?? null,
      propertyType: listing.categories?.[0]?.category || "House",
      listedPriceLabel: isSold ? null : listedPriceLabel,
      listedAt,
      sourceUrl,
      importSource: "raywhite.co.nz",
      externalId,
      leadAgentId: leadAgent?.id ?? null,
      latitude: listing.address?.location?.lat ?? null,
      longitude: listing.address?.location?.lon ?? null,
      seoTitle: `${address} | ${isSold ? "Sold" : "For sale"} with Drew Miller`,
      seoDescription: bodyMarkdown.slice(0, 160).replace(/\s+/g, " "),
      published: true,
      featured: !isSold,
    };

    const saved = existing
      ? await prisma.listing.update({
          where: { id: existing.id },
          data: {
            ...data,
            images: {
              deleteMany: {},
              create: galleryUrls.slice(0, 60).map((url, sortOrder) => ({
                url,
                alt: address,
                sortOrder,
              })),
            },
          },
        })
      : await prisma.listing.create({
          data: {
            ...data,
            images: {
              create: galleryUrls.slice(0, 60).map((url, sortOrder) => ({
                url,
                alt: address,
                sortOrder,
              })),
            },
          },
        });

    await prisma.listingAgent.deleteMany({ where: { listingId: saved.id } });
    if (teamAgents.length > 0) {
      await prisma.listingAgent.createMany({
        data: teamAgents.map(({ agent, index, isLead }) => ({
          listingId: saved.id,
          agentId: agent.id,
          isLead,
          sortOrder: index,
        })),
      });
    }

    if (existing) {
      updated++;
      console.log(`↻ ${address} · ${leadAgent?.name || "no agent"} (${status})`);
    } else {
      created++;
      console.log(`+ ${address} · ${leadAgent?.name || "no agent"} (${status})`);
    }
  }

  console.log(`\nDone. ${created} created, ${updated} updated, ${listings.size} team listings.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
