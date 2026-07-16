"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LatLngExpression } from "leaflet";

export type MapPin = {
  id: string;
  address: string;
  suburb?: string | null;
  latitude: number;
  longitude: number;
  priceLabel?: string | null;
  soldPriceCents?: number | null;
  soldDate?: string | null;
  listingSlug?: string | null;
  kind: "sold" | "current";
};

type Props = {
  sold: MapPin[];
  current: MapPin[];
  className?: string;
};

type LayerMode = "current" | "sold";

function formatPrice(cents?: number | null) {
  if (cents == null) return null;
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Math.round(cents / 100));
}

function pinIconHtml(kind: "sold" | "current") {
  const fill = kind === "current" ? "#111111" : "#ffe512";
  const stroke = "#111111";
  return `
    <div class="map-pin map-pin--${kind}" style="width:28px;height:36px;margin-left:-14px;margin-top:-36px;">
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M14 1.5C8.2 1.5 3.5 6.2 3.5 12c0 7.4 8.2 16.8 9.8 18.6a.9.9 0 0 0 1.4 0C16.3 28.8 24.5 19.4 24.5 12 24.5 6.2 19.8 1.5 14 1.5Z"
          fill="${fill}" stroke="${stroke}" stroke-width="1.75"/>
        <circle cx="14" cy="12" r="4.2" fill="${kind === "current" ? "#ffe512" : "#111111"}"/>
      </svg>
    </div>
  `;
}

export function SalesMap({ sold, current, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<LayerMode>("current");

  const visible = useMemo(
    () => (mode === "current" ? current : sold),
    [mode, current, sold]
  );

  // Init map once
  useEffect(() => {
    let cancelled = false;

    async function mount() {
      const leaflet = await import("leaflet");
      const L = (leaflet.default ?? leaflet) as typeof import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      containerRef.current.innerHTML = "";
      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
      }).setView([-36.72, 174.72], 11);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "&copy; OpenStreetMap &copy; CARTO",
          maxZoom: 19,
        }
      ).addTo(map);

      const layer = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerRef.current = layer;
      LRef.current = L;
      setReady(true);
      requestAnimationFrame(() => map.invalidateSize());
      setTimeout(() => map.invalidateSize(), 200);
    }

    mount();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Draw / redraw pins when mode or data change
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    const L = LRef.current;
    if (!map || !layer || !L || !ready) return;

    layer.clearLayers();
    const bounds: LatLngExpression[] = [];

    for (const pin of visible) {
      const isCurrent = pin.kind === "current";
      const icon = L.divIcon({
        className: "map-pin-icon",
        html: pinIconHtml(isCurrent ? "current" : "sold"),
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -34],
      });

      const marker = L.marker([pin.latitude, pin.longitude], {
        icon,
        riseOnHover: true,
      });

      const price =
        pin.priceLabel ||
        formatPrice(pin.soldPriceCents) ||
        (isCurrent ? "For sale" : "Sold");
      const dateBit =
        !isCurrent && pin.soldDate
          ? `<br/>${new Date(pin.soldDate).toLocaleDateString("en-NZ", {
              timeZone: "Pacific/Auckland",
            })}`
          : "";
      const link = pin.listingSlug
        ? `<p style="margin-top:8px"><a href="/${pin.listingSlug}">View property →</a></p>`
        : "";
      const badge = isCurrent
        ? `<span style="display:inline-block;background:#ffe512;color:#111;padding:2px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">For sale</span><br/>`
        : `<span style="display:inline-block;background:#111;color:#fff;padding:2px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Sold</span><br/>`;

      marker.bindPopup(
        `${badge}<strong>${pin.address}</strong><br/>${pin.suburb || ""}<br/>${price}${dateBit}${link}`
      );
      marker.addTo(layer);
      bounds.push([pin.latitude, pin.longitude]);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds as import("leaflet").LatLngBoundsExpression, {
        padding: [48, 48],
        maxZoom: 14,
      });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else {
      map.setView([-36.72, 174.72], 11);
    }
  }, [visible, ready]);

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Map layer">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "current"}
          onClick={() => setMode("current")}
          className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
            mode === "current"
              ? "bg-rw-yellow text-ink shadow-sm"
              : "border border-line bg-paper/80 text-ink-soft backdrop-blur hover:border-ink/30 hover:text-ink"
          }`}
        >
          Current listings · {current.length}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "sold"}
          onClick={() => setMode("sold")}
          className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
            mode === "sold"
              ? "bg-rw-yellow text-ink shadow-sm"
              : "border border-line bg-paper/80 text-ink-soft backdrop-blur hover:border-ink/30 hover:text-ink"
          }`}
        >
          Previous sales · {sold.length}
        </button>
      </div>

      <div className="map-shell relative min-h-[420px] border border-line">
        <div
          ref={containerRef}
          className="w-full"
          style={{ height: "min(70vh, 560px)" }}
        />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center bg-paper text-sm text-ink-soft">
            Loading map…
          </div>
        )}
        {ready && visible.length === 0 && (
          <div className="absolute inset-0 grid place-items-center bg-paper/90 text-sm text-ink-soft">
            No pins in this view yet.
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-2">
          <span
            className={`inline-block h-3 w-3 rounded-full border border-ink ${
              mode === "current" ? "bg-ink" : "bg-rw-yellow"
            }`}
            aria-hidden
          />
          {mode === "current" ? "Current listings" : "Previous sales"}
        </span>
        <span>
          Showing {visible.length}{" "}
          {mode === "current" ? "for-sale" : "sold"} pin
          {visible.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
