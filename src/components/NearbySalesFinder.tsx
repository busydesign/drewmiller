"use client";

import { useState } from "react";
import Link from "next/link";

type NearbySale = {
  id: string;
  address: string;
  suburb?: string | null;
  soldPriceCents?: number | null;
  soldDate?: string | null;
  distanceKm?: number;
  listingSlug?: string | null;
};

function formatPrice(cents?: number | null) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}

export function NearbySalesFinder() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NearbySale[]>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nearby-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, radiusKm: 3 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not find nearby sales");
      setResults(data.sales || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-line bg-paper p-5">
      <p className="eyebrow">Your address</p>
      <h2 className="display mt-2 text-3xl">Nearby previous sales</h2>
      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 12 Beach Road, Mairangi Bay"
          className="w-full border border-line bg-white px-3 py-3 text-sm outline-none ring-sea focus:ring-2"
          required
        />
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Searching…" : "Show nearby sales"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <ul className="mt-5 max-h-[360px] space-y-3 overflow-auto">
        {results.map((sale) => (
          <li key={sale.id} className="border-b border-line pb-3 text-sm">
            <p className="font-medium">{sale.address}</p>
            <p className="text-ink-soft">
              {formatPrice(sale.soldPriceCents)}
              {sale.distanceKm != null ? ` · ${sale.distanceKm.toFixed(1)} km` : ""}
            </p>
            {sale.listingSlug && (
              <Link href={`/${sale.listingSlug}`} className="text-sea-deep underline">
                View page
              </Link>
            )}
          </li>
        ))}
        {!loading && !error && results.length === 0 && (
          <li className="text-sm text-ink-soft">
            Enter an address to pull recent sales around you.
          </li>
        )}
      </ul>
    </div>
  );
}
