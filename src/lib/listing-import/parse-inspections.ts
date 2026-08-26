export type RayWhiteInspection = {
  start?: string;
  finish?: string;
  startAt?: string;
  finishAt?: string;
};

export type RayWhiteAuction = {
  date?: string;
  at?: string;
  atUtc?: string;
  location?: string;
};

export type ParsedOpenHome = {
  startsAt: Date;
  endsAt: Date;
};

export type ParsedAuction = {
  auctionAt: Date;
  auctionLocation: string | null;
};

function parseApiDate(raw?: string | null): Date | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  const withZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value)
    ? value
    : `${value}+12:00`;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseRayWhiteInspections(
  rows?: RayWhiteInspection[] | null
): ParsedOpenHome[] {
  if (!rows?.length) return [];

  const homes: ParsedOpenHome[] = [];
  for (const row of rows) {
    const startsAt = parseApiDate(row.startAt || row.start);
    const endsAt = parseApiDate(row.finishAt || row.finish);
    if (!startsAt || !endsAt || endsAt.getTime() <= startsAt.getTime()) {
      continue;
    }
    homes.push({ startsAt, endsAt });
  }

  return homes.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export function parseRayWhiteAuction(
  auction?: RayWhiteAuction | null
): ParsedAuction | null {
  if (!auction) return null;
  const auctionAt = parseApiDate(auction.at || auction.date || auction.atUtc);
  if (!auctionAt) return null;
  const auctionLocation = auction.location?.trim() || null;
  return { auctionAt, auctionLocation };
}

export function openHomesToIso(homes: ParsedOpenHome[]) {
  return homes.map((home) => ({
    startsAt: home.startsAt.toISOString(),
    endsAt: home.endsAt.toISOString(),
  }));
}
