import { decodeHtmlEntities } from "@/lib/listing-import/decode-html";
import type { ListingImportPreview } from "@/lib/listing-import/types";

const API = "https://rwmairangibay.co.nz/api/proxy/v1";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

type ApiAddress = {
  unitNumber?: string;
  streetNumber?: string;
  streetName?: string;
  streetType?: string;
  suburb?: string;
  region?: string;
  state?: string;
  formatted?: string;
  location?: { lat?: number; lon?: number };
};

type ApiListing = {
  id?: number;
  sourceId?: string;
  title?: string;
  description?: string;
  displayPrice?: string;
  bedrooms?: number;
  bathrooms?: number;
  carSpaces?: number;
  status?: string;
  statusCode?: string;
  listingState?: string;
  typeCode?: string;
  underOffer?: boolean;
  address?: ApiAddress;
  images?: Array<{ url?: string }>;
  measurements?: Array<{ code?: string; name?: string; value?: number }>;
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

function titleCase(value?: string | null) {
  if (!value) return "";
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatArea(value: number, hint: string): string {
  if (/land/i.test(hint) && value >= 10000) {
    const ha = value / 10000;
    return `${Number.isInteger(ha) ? ha : ha.toFixed(2)} ha`;
  }
  return `${value} m2`;
}

function formatAddress(address?: ApiAddress): string {
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

  const locality = [
    titleCase(address.suburb),
    titleCase(address.region || address.state),
  ]
    .filter(Boolean)
    .join(", ");

  return [street, locality].filter(Boolean).join(", ");
}

function measurement(
  rows: ApiListing["measurements"],
  code: string
): string | null {
  const row = rows?.find((r) => r.code === code && r.value != null);
  if (!row?.value) return null;
  return formatArea(row.value, row.name || code);
}

function listingToPreview(
  listing: ApiListing,
  sourceUrl: string
): ListingImportPreview {
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
  const propertyType = listing.categories?.[0]?.category || "House";
  const externalId = listing.sourceId || (listing.id ? `rw:${listing.id}` : null);

  const galleryUrls = [
    ...new Set(
      (listing.images || [])
        .map((img) => img.url?.split("?")[0])
        .filter((u): u is string => Boolean(u))
    ),
  ];

  const agents = (listing.agents || [])
    .map((a) => ({
      fullName: cleanText(a.fullName || ""),
      memberId: a.memberId ?? null,
    }))
    .filter((a) => a.fullName);

  const sold =
    listing.statusCode === "SLD" ||
    /sold/i.test(listing.status || "") ||
    /sold/i.test(listedPriceLabel || "") ||
    listing.typeCode === "AUC";

  const summaryBits = [
    headline || null,
    listedPriceLabel,
    building ? `Building ${building}` : null,
    land ? `Land ${land}` : null,
  ].filter(Boolean);

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
      agentName: agents[0]?.fullName || "Drew Miller",
      agentMemberId: agents[0]?.memberId ?? null,
      agents,
      externalId,
      agencyName: "Ray White Mairangi Bay",
      listedPriceLabel,
      buildingArea: building,
      landArea: land,
      propertyType,
    },
  };
}

async function fetchListingBySourceId(
  sourceId: string
): Promise<ApiListing | null> {
  const url = `${API}/listings?q=sourceId:${encodeURIComponent(sourceId)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      Referer: "https://rwmairangibay.co.nz/",
    },
    cache: "no-store",
    // @ts-expect-error Node fetch TLS option used in some runtimes
    rejectUnauthorized: false,
  });

  if (!res.ok) return null;

  const json = (await res.json()) as { data?: Array<{ value?: ApiListing }> };
  const listing = json.data?.[0]?.value;
  return listing?.id ? listing : null;
}

/** Fallback when raywhite.co.nz HTML is blocked (e.g. CloudFront on server IPs). */
export async function fetchRayWhiteListingFromApi(
  sourceId: string,
  sourceUrl: string
): Promise<ListingImportPreview | null> {
  const listing = await fetchListingBySourceId(sourceId);
  if (!listing) return null;
  return listingToPreview(listing, sourceUrl);
}
