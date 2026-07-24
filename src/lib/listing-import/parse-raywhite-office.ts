import { decodeHtmlEntities } from "@/lib/listing-import/decode-html";
import type { ListingImportPreview } from "@/lib/listing-import/types";

type OfficeAddress = {
  unitNumber?: string;
  streetNumber?: string;
  streetName?: string;
  streetType?: string;
  suburb?: string;
  region?: string;
  state?: string;
  postCode?: string;
  formatted?: string;
  location?: { lat?: number; lon?: number };
};

type OfficeMeasurement = {
  name?: string;
  code?: string;
  value?: number;
};

type OfficeListing = {
  listingId?: number;
  id?: number;
  sourceId?: string;
  title?: string;
  description?: string;
  displayPrice?: string;
  price?: string;
  bedrooms?: number;
  bathrooms?: number;
  carSpaces?: number;
  type?: string;
  typeCode?: string;
  listingState?: string;
  status?: string;
  address?: OfficeAddress;
  images?: Array<{ url?: string }>;
  measurements?: OfficeMeasurement[];
  categories?: Array<{ category?: string }>;
  agents?: Array<{ fullName?: string; memberId?: number }>;
  links?: Array<{ url?: string; code?: string }>;
};

function cleanText(s: string) {
  return decodeHtmlEntities(s).replace(/\s+/g, " ").trim();
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

function formatArea(value: number, unitHint: string): string {
  // Prefer ha for large land parcels; otherwise m2
  if (/land/i.test(unitHint) && value >= 10000) {
    const ha = value / 10000;
    return `${Number.isInteger(ha) ? ha : ha.toFixed(2)} ha`;
  }
  return `${value} m2`;
}

function formatAddress(address?: OfficeAddress): string {
  if (!address) return "";

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

  const locality = [address.suburb, address.region || address.state]
    .filter(Boolean)
    .join(", ");
  const joined = [street, locality].filter(Boolean).join(", ");
  if (joined) return cleanText(joined);
  return "";
}

function extractInitialState(html: string): Record<string, unknown> | null {
  const m = html.match(
    /window\.INITIAL_STATE\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/i
  );
  if (!m?.[1]) return null;
  try {
    return JSON.parse(m[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function listingFromState(
  state: Record<string, unknown>,
  sourceUrl: string
): OfficeListing | null {
  const listings = state.listings as
    | { entities?: Record<string, OfficeListing> }
    | undefined;
  const entities = listings?.entities;
  if (!entities) return null;

  // Prefer listing id from URL path (/house/3525909)
  const idFromUrl = sourceUrl.match(/\/(\d{5,})(?:\/)?(?:\?|#|$)/)?.[1];
  if (idFromUrl && entities[idFromUrl]) {
    return entities[idFromUrl];
  }

  const values = Object.values(entities);
  if (values.length === 1) return values[0];

  // Fallback: richest Active / Current home listing
  return (
    values.find(
      (row) =>
        /active|current/i.test(row.listingState || row.status || "") &&
        (row.bedrooms != null || row.description)
    ) ||
    values[0] ||
    null
  );
}

function measurement(
  rows: OfficeMeasurement[] | undefined,
  code: string
): string | null {
  const row = rows?.find((r) => r.code === code && r.value != null);
  if (!row || row.value == null) return null;
  return formatArea(row.value, row.name || code);
}

/** Ray White office sites (e.g. rwmairangibay.co.nz) embed listing JSON in INITIAL_STATE. */
export function parseRayWhiteOffice(
  html: string,
  sourceUrl: string
): ListingImportPreview | null {
  const state = extractInitialState(html);
  if (!state) return null;

  const listing = listingFromState(state, sourceUrl);
  if (!listing) return null;

  const propertyAddress =
    formatAddress(listing.address) ||
    cleanText(listing.title || "") ||
    "Ray White listing";

  const headline = cleanText(listing.title || "");
  const bodyHtml = (listing.description || "").trim();
  const bodyMarkdown = stripTags(bodyHtml);
  const listedPriceLabel = cleanText(listing.displayPrice || "") || null;
  const building = measurement(listing.measurements, "BAS");
  const land = measurement(listing.measurements, "LAS");
  const propertyType =
    listing.categories?.[0]?.category ||
    (listing.type?.replace(/\s*for sale.*/i, "").trim() || null) ||
    "House";

  const galleryUrls = [
    ...new Set(
      (listing.images || [])
        .map((img) => img.url?.replace(/\\u002F/g, "/").split("?")[0])
        .filter((u): u is string => Boolean(u))
    ),
  ];

  // Preserve full agent list (lead is first on Ray White)
  const agents = (listing.agents || [])
    .map((a) => ({
      fullName: cleanText(a.fullName || ""),
      memberId: a.memberId ?? null,
    }))
    .filter((a) => a.fullName);
  const agentName = agents[0]?.fullName || "Drew Miller";
  const agentMemberId = agents[0]?.memberId ?? null;

  const summaryBits = [
    headline || null,
    listedPriceLabel,
    building ? `Building ${building}` : null,
    land ? `Land ${land}` : null,
  ].filter(Boolean);

  const sold =
    /sold/i.test(listedPriceLabel || "") ||
    /sold/i.test(listing.listingState || "") ||
    listing.typeCode === "AUC";

  return {
    source: "raywhite.co.nz",
    sourceUrl,
    title: headline || propertyAddress,
    propertyAddress,
    description: [headline, bodyMarkdown].filter(Boolean).join("\n\n") || null,
    bodyHtml: bodyHtml || null,
    bodyMarkdown: bodyMarkdown || null,
    summary: summaryBits.join(" · ") || null,
    galleryUrls,
    status: sold ? "SOLD" : "FOR_SALE",
    listedPriceLabel,
    propertyType,
    buildingArea: building,
    landArea: land,
    latitude: listing.address?.location?.lat ?? null,
    longitude: listing.address?.location?.lon ?? null,
    hints: {
      bedrooms: listing.bedrooms ?? null,
      bathrooms: listing.bathrooms ?? null,
      parking: listing.carSpaces ?? null,
      agentName,
      agentMemberId,
      agents,
      externalId: listing.sourceId || (listing.listingId ? `rw:${listing.listingId}` : null),
      agencyName: "Ray White Mairangi Bay",
      listedPriceLabel,
      buildingArea: building,
      landArea: land,
      propertyType,
    },
  };
}

export function isRayWhiteOfficeHtml(html: string): boolean {
  return /window\.INITIAL_STATE\s*=/.test(html);
}
