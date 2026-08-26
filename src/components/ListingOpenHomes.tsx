import { CalendarClock, Gavel } from "lucide-react";
import {
  formatAuction,
  formatOpenHome,
  upcomingAuctionAt,
  upcomingOpenHomes,
} from "@/lib/open-homes";

type Home = {
  id?: string;
  startsAt: Date;
  endsAt: Date;
};

type Props = {
  homes: Home[];
  auctionAt?: Date | null;
  auctionLocation?: string | null;
};

export function ListingOpenHomes({
  homes,
  auctionAt,
  auctionLocation,
}: Props) {
  const upcoming = upcomingOpenHomes(homes);
  const auctionUpcoming = upcomingAuctionAt(auctionAt);

  if (upcoming.length === 0 && !auctionUpcoming) return null;

  return (
    <div className="mt-5 space-y-4 border-b border-line pb-5">
      {auctionUpcoming ? (
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
            <Gavel className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            Auction
          </p>
          <p className="mt-1.5 text-sm font-medium text-ink">
            {formatAuction(auctionUpcoming, auctionLocation)}
          </p>
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
            <CalendarClock
              className="h-3.5 w-3.5"
              strokeWidth={1.75}
              aria-hidden
            />
            Open homes
          </p>
          <ul className="mt-2 space-y-1.5">
            {upcoming.map((home) => {
              const { day, time } = formatOpenHome(home);
              return (
                <li
                  key={home.id || home.startsAt.toISOString()}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="font-medium text-ink">{day}</span>
                  <span className="shrink-0 text-ink-soft">{time}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
