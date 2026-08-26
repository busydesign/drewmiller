export const NZ_TZ = "Pacific/Auckland";

export type OpenHomeTimes = {
  startsAt: Date;
  endsAt: Date;
};

function nzDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NZ_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatNzTime(date: Date): string {
  return new Intl.DateTimeFormat("en-NZ", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: NZ_TZ,
  })
    .format(date)
    .toLowerCase()
    .replace(/\s/g, "");
}

function formatTimeRange(startsAt: Date, endsAt: Date): string {
  const start = formatNzTime(startsAt);
  const end = formatNzTime(endsAt);
  const startMer = start.slice(-2);
  const endMer = end.slice(-2);
  const startClock = startMer === endMer ? start.slice(0, -2) : start;
  return `${startClock}–${end}`;
}

export function upcomingOpenHomes<T extends OpenHomeTimes>(
  homes: T[],
  now = new Date()
): T[] {
  return [...homes]
    .filter((home) => home.endsAt.getTime() >= now.getTime())
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export function upcomingAuctionAt(
  auctionAt?: Date | null,
  now = new Date()
): Date | null {
  if (!auctionAt || auctionAt.getTime() < now.getTime()) return null;
  return auctionAt;
}

function addNzDays(date: Date, days: number): string {
  const [year, month, day] = nzDateKey(date).split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

export function formatOpenHome(home: OpenHomeTimes): {
  day: string;
  time: string;
  compact: string;
} {
  const todayKey = nzDateKey(new Date());
  const tomorrowKey = addNzDays(new Date(), 1);
  const homeKey = nzDateKey(home.startsAt);

  const longDay = new Intl.DateTimeFormat("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: NZ_TZ,
  }).format(home.startsAt);

  const day =
    homeKey === todayKey
      ? "Today"
      : homeKey === tomorrowKey
        ? "Tomorrow"
        : longDay;
  const time = formatTimeRange(home.startsAt, home.endsAt);
  const compactDay =
    day === "Today" || day === "Tomorrow"
      ? day
      : new Intl.DateTimeFormat("en-NZ", {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone: NZ_TZ,
        }).format(home.startsAt);

  return {
    day,
    time,
    compact: `${compactDay} · ${time}`,
  };
}

export function nextOpenHomeLabel(
  homes: OpenHomeTimes[],
  now = new Date()
): string | null {
  const next = upcomingOpenHomes(homes, now)[0];
  return next ? formatOpenHome(next).compact : null;
}

export function formatAuction(auctionAt: Date, location?: string | null): string {
  const day = new Intl.DateTimeFormat("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: NZ_TZ,
  }).format(auctionAt);
  const when = `${day}, ${formatNzTime(auctionAt)}`;
  return location ? `${when} · ${location}` : when;
}

/** `datetime-local` value in NZ wall time, e.g. 2026-08-29T12:00 */
export function toNzDateTimeLocal(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function fromNzDateTimeLocal(value: string): Date | null {
  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const offset = aucklandOffsetIso(
    new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12))
  );
  const parsed = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:00${offset}`
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function aucklandOffsetIso(at: Date): string {
  const tz =
    new Intl.DateTimeFormat("en-NZ", {
      timeZone: NZ_TZ,
      timeZoneName: "longOffset",
    })
      .formatToParts(at)
      .find((part) => part.type === "timeZoneName")?.value || "";
  const match = tz.match(/([+-]\d{2}:\d{2})$/);
  if (match) return match[1];
  const gmt = tz.match(/GMT([+-]\d+)/i);
  if (gmt) {
    const hours = Number(gmt[1]);
    return `${hours >= 0 ? "+" : "-"}${String(Math.abs(hours)).padStart(2, "0")}:00`;
  }
  return "+12:00";
}
