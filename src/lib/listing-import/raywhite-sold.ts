/** True when a marketing label is an actual sold result, not “unless sold prior”. */
export function isSoldPriceLabel(label?: string | null): boolean {
  const value = (label || "").trim();
  if (!value) return false;
  if (/unless sold/i.test(value)) return false;
  return /^sold\b/i.test(value);
}

/** Ray White current auctions use typeCode AUC / “unless sold prior” — those are still for sale. */
export function isRayWhiteListingSold(listing: {
  statusCode?: string | null;
  status?: string | null;
  listingState?: string | null;
  displayPrice?: string | null;
}): boolean {
  const code = (listing.statusCode || "").toUpperCase();
  if (code === "SLD") return true;
  if (code === "CUR") return false;

  const status = (listing.status || "").trim();
  if (/^current$/i.test(status)) return false;
  if (/^sold\b/i.test(status)) return true;

  const state = (listing.listingState || "").trim();
  if (/^sold\b/i.test(state)) return true;

  return isSoldPriceLabel(listing.displayPrice);
}
