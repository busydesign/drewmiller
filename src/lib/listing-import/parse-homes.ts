import type { ListingImportPreview } from "@/lib/listing-import/types";
import {
  jsonFieldNumber,
  jsonFieldString,
  metaContent,
  metaNameContent,
} from "@/lib/listing-import/parse-meta";
import { parseNzMoneyToCents } from "@/lib/listing-import/parse-money";

const HOMES_LISTING_IMAGE_RE =
  /https:\/\/images\.homes\.co\.nz\/resize\/fill\/\d+\/\d+\/ce\/0\/plain\/https:\/\/s3-ap-southeast-2\.amazonaws\.com\/homes-listing-images\/\d+/g;

function extractHomesGallery(html: string): string[] {
  const found = html.match(HOMES_LISTING_IMAGE_RE) ?? [];
  return [...new Set(found)].slice(0, 16);
}

function parseAddressFromOgTitle(ogTitle: string | null): string | null {
  if (!ogTitle) return null;
  let t = ogTitle.replace(/\s*-\s*homes\.co\.nz\s*$/i, "").trim();
  t = t.replace(/^(Recently sold|For sale|Sold)\s*\|\s*/i, "").trim();
  return t.length > 0 ? t : null;
}

function parseAgentFromDescription(desc: string | null): {
  agentName: string | null;
  agencyName: string | null;
} {
  if (!desc) return { agentName: null, agencyName: null };
  const agentM = desc.match(/Contact agent\s+([^,]+)/i);
  return {
    agentName: agentM?.[1]?.trim() ?? null,
    agencyName: null,
  };
}

function parseSaleFromDescription(desc: string | null): {
  soldDate: string | null;
  soldPriceNote: string | null;
} {
  if (!desc) return { soldDate: null, soldPriceNote: null };
  const m = desc.match(
    /Most recent sale for\s+(\$[^.]+?)\s+on\s+([^.]+)\./i
  );
  return {
    soldPriceNote: m?.[1]?.trim() ?? null,
    soldDate: m?.[2]?.trim() ?? null,
  };
}

function buildDescription(parts: {
  address: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  homesEstimate: string | null;
  capitalValue: string | null;
  agentName: string | null;
  soldDate: string | null;
  soldPriceNote: string | null;
  sourceUrl: string;
}): string {
  const lines: string[] = [];
  const specs: string[] = [];
  if (parts.bedrooms != null) specs.push(`${parts.bedrooms} bed`);
  if (parts.bathrooms != null) specs.push(`${parts.bathrooms} bath`);
  if (parts.parking != null) specs.push(`${parts.parking} car`);
  if (specs.length) lines.push(specs.join(" · "));

  if (parts.homesEstimate) {
    lines.push(`HomesEstimate ${parts.homesEstimate}`);
  }
  if (parts.capitalValue) {
    lines.push(`Capital valuation ${parts.capitalValue}`);
  }
  if (parts.soldDate || parts.soldPriceNote) {
    lines.push(
      `Sold${parts.soldPriceNote ? ` ${parts.soldPriceNote}` : ""}${
        parts.soldDate ? ` · ${parts.soldDate}` : ""
      }`
    );
  }
  if (parts.agentName) {
    lines.push(`Listing agent ${parts.agentName}`);
  }
  return lines.join("\n");
}

export function parseHomesCoNz(html: string, sourceUrl: string): ListingImportPreview {
  const ogTitle = metaContent(html, "og:title");
  const ogImage = metaContent(html, "og:image");
  const metaDesc = metaNameContent(html, "description");

  const displayAddress =
    jsonFieldString(html, "display_address") ??
    parseAddressFromOgTitle(ogTitle) ??
    "Property";

  const bedrooms =
    jsonFieldNumber(html, "latest_bedrooms") ??
    jsonFieldNumber(html, "num_bedrooms");
  const bathrooms =
    jsonFieldNumber(html, "latest_bathrooms") ??
    jsonFieldNumber(html, "num_bathrooms");
  const parking =
    jsonFieldNumber(html, "latest_car_spaces") ??
    jsonFieldNumber(html, "num_car_spaces");

  const homesEstimateShort =
    jsonFieldString(html, "display_estimated_value_short") ?? null;
  const homesEstimateLowShort =
    jsonFieldString(html, "display_estimated_lower_value_short") ?? null;
  const homesEstimateHighShort =
    jsonFieldString(html, "display_estimated_upper_value_short") ?? null;
  const rentLowShort =
    jsonFieldString(html, "display_estimated_rental_lower_value_short") ?? null;
  const rentHighShort =
    jsonFieldString(html, "display_estimated_rental_upper_value_short") ?? null;
  const soldPriceDisplay =
    jsonFieldString(html, "display_price_short") ??
    jsonFieldString(html, "display_price") ??
    null;
  const capitalValueShort =
    jsonFieldString(html, "display_capital_value_short") ?? null;
  const capitalValueDollars = jsonFieldNumber(html, "capital_value");

  const capitalValueCents =
    capitalValueDollars != null
      ? Math.round(capitalValueDollars * 100)
      : parseNzMoneyToCents(capitalValueShort);
  const homesEstimateCents = parseNzMoneyToCents(homesEstimateShort);
  const homesEstimateLowCents = parseNzMoneyToCents(homesEstimateLowShort);
  const homesEstimateHighCents = parseNzMoneyToCents(homesEstimateHighShort);
  const rentEstimateLowCents = parseNzMoneyToCents(rentLowShort);
  const rentEstimateHighCents = parseNzMoneyToCents(rentHighShort);

  const { agentName } = parseAgentFromDescription(metaDesc);
  const agencyMatch =
    html.match(/Ray White\s*[-–]\s*[^<"]{2,60}/i) ??
    html.match(/(?:Barfoot|Harcourts|Bayleys|Property\s+Guys)[^<"]{0,50}/i);
  const agencyName = agencyMatch?.[0]
    ?.replace(/&amp;/g, "&")
    .trim() ?? null;

  const { soldDate, soldPriceNote } = parseSaleFromDescription(metaDesc);
  const isSold =
    /recently sold|^sold\s*\|/i.test(ogTitle ?? "") ||
    /\bSOLD\b/.test(html.slice(0, 50_000));

  const galleryUrls = extractHomesGallery(html);
  if (ogImage && !galleryUrls.includes(ogImage)) {
    galleryUrls.unshift(ogImage);
  }

  const description = buildDescription({
    address: displayAddress,
    bedrooms,
    bathrooms,
    parking,
    homesEstimate: homesEstimateShort,
    capitalValue: capitalValueShort,
    agentName,
    soldDate,
    soldPriceNote,
    sourceUrl,
  });

  return {
    source: "homes.co.nz",
    sourceUrl,
    title: displayAddress,
    propertyAddress: displayAddress,
    description,
    galleryUrls,
    status: isSold ? "SOLD" : "INSPECTIONS",
    hints: {
      bedrooms,
      bathrooms,
      parking,
      capitalValueCents,
      homesEstimateCents,
      homesEstimateLabel: homesEstimateShort,
      homesEstimateLowCents,
      homesEstimateHighCents,
      homesEstimateLowLabel: homesEstimateLowShort,
      homesEstimateHighLabel: homesEstimateHighShort,
      rentEstimateLowCents,
      rentEstimateHighCents,
      rentEstimateLowLabel: rentLowShort,
      rentEstimateHighLabel: rentHighShort,
      soldPriceDisplay,
      agentName,
      agencyName,
      soldDate,
      soldPriceNote,
    },
  };
}
