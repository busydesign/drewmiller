import { parseNzWallDateTime } from "@/lib/open-homes";

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

export function parseRayWhiteInspections(
  rows?: RayWhiteInspection[] | null
): ParsedOpenHome[] {
  if (!rows?.length) return [];

  const homes: ParsedOpenHome[] = [];
  for (const row of rows) {
    const startsAt = parseNzWallDateTime(row.start || row.startAt);
    const endsAt = parseNzWallDateTime(row.finish || row.finishAt);
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
  const auctionAt = parseNzWallDateTime(
    auction.date || auction.at || auction.atUtc
  );
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
