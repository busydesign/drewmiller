import type { Metadata } from "next";
import { SalesMap } from "@/components/SalesMap";
import { NearbySalesFinder } from "@/components/NearbySalesFinder";
import { getSalesMapPins } from "@/lib/map-pins";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sales map",
  description:
    "Explore Drew Miller’s sold North Shore properties on an interactive map — and see what is currently for sale nearby.",
};

export default async function MapPage() {
  const { sold, current, suburbs } = await getSalesMapPins();

  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow">Interactive</p>
        <h1 className="display mt-2 text-5xl md:text-6xl">Sales map</h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          {sold.length.toLocaleString("en-NZ")} completed sales mapped across
          Auckland’s North Shore. Yellow pins are sold. Switch layers to see
          homes currently for sale, or search an address for nearby results.
        </p>

        {suburbs.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {suburbs.map((row) => (
              <span
                key={row.suburb}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-mist px-3 py-1.5 text-xs text-ink-soft"
              >
                <span className="font-medium text-ink">{row.suburb}</span>
                <span aria-hidden>·</span>
                <span>{row.count}</span>
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)] lg:items-start">
          <SalesMap sold={sold} current={current} defaultMode="sold" />
          <div className="lg:sticky lg:top-24">
            <NearbySalesFinder />
            <p className="mt-4 text-sm text-ink-soft">
              {sold.length} sold · {current.length} for sale on the map.
              Unsuccessful or inaccurate records are excluded as they are
              reviewed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
