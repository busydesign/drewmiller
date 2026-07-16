"use client";

import { useMemo, useState } from "react";
import { ListingCard, type ListingCardAgent } from "@/components/ListingCard";

export type SoldListingCardData = {
  id: string;
  slug: string;
  title: string;
  address: string;
  suburb: string | null;
  coverImageUrl: string | null;
  soldPriceCents: number | null;
  soldDate: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  agents: ListingCardAgent[];
};

type Props = {
  listings: SoldListingCardData[];
};

function matchesQuery(listing: SoldListingCardData, raw: string) {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    listing.address,
    listing.suburb,
    listing.title,
    listing.slug.replace(/-/g, " "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

export function SoldListingsSearch({ listings }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => listings.filter((listing) => matchesQuery(listing, query)),
    [listings, query]
  );

  return (
    <div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block w-full max-w-xl">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-ink-soft">
            Search sold properties
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Address, suburb, street…"
            className="mt-2 w-full border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-ink"
            autoComplete="street-address"
          />
        </label>
        <p className="text-sm text-ink-soft sm:pb-3">
          {query.trim()
            ? `${filtered.length} of ${listings.length} matches`
            : `${listings.length} sold listings`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 border border-line bg-paper px-5 py-8 text-ink-soft">
          No sold listings match “{query.trim()}”. Try a suburb or street name.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              slug={listing.slug}
              title={listing.title}
              address={listing.address}
              suburb={listing.suburb}
              coverImageUrl={listing.coverImageUrl}
              soldPriceCents={listing.soldPriceCents}
              soldDate={listing.soldDate}
              bedrooms={listing.bedrooms}
              bathrooms={listing.bathrooms}
              agents={listing.agents}
            />
          ))}
        </div>
      )}
    </div>
  );
}
