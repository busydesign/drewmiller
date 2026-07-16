export type ListingImportSource =
  | "homes.co.nz"
  | "trademe.co.nz"
  | "oneroof.co.nz"
  | "raywhite.co.nz"
  | "unknown";

export type ListingImportHints = {
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  capitalValueCents?: number | null;
  homesEstimateCents?: number | null;
  /** Short labels from homes.co.nz (e.g. $870K). */
  homesEstimateLabel?: string | null;
  homesEstimateLowCents?: number | null;
  homesEstimateHighCents?: number | null;
  homesEstimateLowLabel?: string | null;
  homesEstimateHighLabel?: string | null;
  rentEstimateLowCents?: number | null;
  rentEstimateHighCents?: number | null;
  rentEstimateLowLabel?: string | null;
  rentEstimateHighLabel?: string | null;
  soldPriceDisplay?: string | null;
  agentName?: string | null;
  /** Ray White office member id for team matching */
  agentMemberId?: number | null;
  agencyName?: string | null;
  externalId?: string | null;
  soldDate?: string | null;
  soldPriceNote?: string | null;
  listedPriceLabel?: string | null;
  buildingArea?: string | null;
  landArea?: string | null;
  propertyType?: string | null;
};

/** Parsed listing data agents can apply when creating a property. */
export type ListingImportPreview = {
  source: ListingImportSource;
  sourceUrl: string;
  title: string;
  propertyAddress: string;
  description: string | null;
  galleryUrls: string[];
  /** Ray White / enriched HTML body when available */
  bodyHtml?: string | null;
  bodyMarkdown?: string | null;
  summary?: string | null;
  listedPriceLabel?: string | null;
  propertyType?: string | null;
  buildingArea?: string | null;
  landArea?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** When the listing appears sold / for sale */
  status?: "SOLD" | "FOR_SALE" | "INSPECTIONS";
  hints: ListingImportHints;
};
