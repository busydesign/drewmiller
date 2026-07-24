export const ADMIN_LISTING_STATUSES = [
  "FOR_SALE",
  "SOLD",
  "WITHDRAWN",
] as const;

export type AdminListingStatus = (typeof ADMIN_LISTING_STATUSES)[number];

export function parseAdminListingStatus(
  value: unknown
): AdminListingStatus | null {
  if (typeof value !== "string") return null;
  return ADMIN_LISTING_STATUSES.includes(value as AdminListingStatus)
    ? (value as AdminListingStatus)
    : null;
}

/** Map any DB status to the three admin options. */
export function toAdminListingStatus(status: string): AdminListingStatus {
  if (status === "SOLD") return "SOLD";
  if (status === "WITHDRAWN" || status === "ARCHIVED") return "WITHDRAWN";
  return "FOR_SALE";
}

export function listingStatusLabel(status: string): string {
  switch (toAdminListingStatus(status)) {
    case "SOLD":
      return "Sold";
    case "WITHDRAWN":
      return "Withdrawn";
    default:
      return "For Sale";
  }
}

export function isCurrentListingStatus(status: string): boolean {
  return (
    status === "FOR_SALE" ||
    status === "UNDER_OFFER" ||
    status === "COMING_SOON"
  );
}
