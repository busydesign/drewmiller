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
  /** Default layer — sold emphasises track record */
  defaultMode?: LayerMode;
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

function PinSwatch({ kind }: { kind: "sold" | "current" }) {
  const fill = kind === "current" ? "#111111" : "#ffe512";
  const dot = kind === "current" ? "#ffe512" : "#111111";
  return (
    <svg width="14" height="18" viewBox="0 0 28 36" aria-hidden className="shrink-0">
      <path
        d="M14 1.5C8.2 1.5 3.5 6.2 3.5 12c0 7.4 8.2 16.8 9.8 18.6a.9.9 0 0 0 1.4 0C16.3 28.8 24.5 19.4 24.5 12 24.5 6.2 19.8 1.5 14 1.5Z"
        fill={fill}
        stroke="#111"
        strokeWidth="1.75"
      />
      <circle cx="14" cy="12" r="4.2" fill={dot} />
    </svg>
  );
}

export function SalesMap({
  sold,
  current,
  className,
  defaultMode = "sold",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<LayerMode>(defaultMode);
  const [gestureHint, setGestureHint] = useState(false);

  const visible = useMemo(
    () => (mode === "current" ? current : sold),
    [mode, current, sold]
  );

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
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: false,
        keyboard: true,
        zoomControl: true,
      }).setView([-36.72, 174.72], 11);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "&copy; OpenStreetMap &copy; CARTO",
          maxZoom: 19,
        }
      ).addTo(map);

      map.zoomControl.setPosition("bottomright");

      // Desktop: click map to toggle scroll zoom. Mobile uses pinch.
      map.on("click", () => {
        if (map.scrollWheelZoom.enabled()) {
          map.scrollWheelZoom.disable();
          setGestureHint(false);
        } else {
          map.scrollWheelZoom.enable();
          setGestureHint(true);
        }
      });
      map.on("mouseout", () => {
        map.scrollWheelZoom.disable();
        setGestureHint(false);
      });

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
        (isCurrent ? "Price on application" : "Sold");
      const dateBit =
        !isCurrent && pin.soldDate
          ? `<br/><span style="color:#666">${new Date(
              pin.soldDate
            ).toLocaleDateString("en-NZ", {
              timeZone: "Pacific/Auckland",
              year: "numeric",
              month: "short",
            })}</span>`
          : "";
      const link = pin.listingSlug
        ? `<p style="margin:10px 0 0"><a href="/${pin.listingSlug}" style="font-weight:600;color:#111">View property →</a></p>`
        : "";
      const badge = isCurrent
        ? `<span style="display:inline-block;background:#ffe512;color:#111;padding:3px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;border-radius:999px">For sale</span><br/>`
        : `<span style="display:inline-block;background:#111;color:#fff;padding:3px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;border-radius:999px">Sold</span><br/>`;

      marker.bindPopup(
        `<div style="min-width:160px;font-size:13px;line-height:1.4">${badge}<strong style="font-size:14px">${pin.address}</strong><br/><span style="color:#666">${pin.suburb || "North Shore"}</span><br/><span style="margin-top:4px;display:inline-block;font-weight:600">${price}</span>${dateBit}${link}</div>`,
        { maxWidth: 260, className: "map-popup" }
      );
      marker.addTo(layer);
      bounds.push([pin.latitude, pin.longitude]);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds as import("leaflet").LatLngBoundsExpression, {
        padding: [40, 40],
        maxZoom: 13,
      });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else {
      map.setView([-36.72, 174.72], 11);
    }

    requestAnimationFrame(() => map.invalidateSize());
  }, [visible, ready]);

  return (
    <div className={className}>
      <div
        className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        role="tablist"
        aria-label="Map layer"
      >
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "sold"}
            onClick={() => setMode("sold")}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] transition sm:min-h-10 ${
              mode === "sold"
                ? "bg-rw-yellow text-ink"
                : "border border-line bg-paper text-ink-soft hover:border-ink/30 hover:text-ink"
            }`}
          >
            <PinSwatch kind="sold" />
            Sold · {sold.length}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "current"}
            onClick={() => setMode("current")}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] transition sm:min-h-10 ${
              mode === "current"
                ? "bg-rw-yellow text-ink"
                : "border border-line bg-paper text-ink-soft hover:border-ink/30 hover:text-ink"
            }`}
          >
            <PinSwatch kind="current" />
            For sale · {current.length}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <PinSwatch kind="sold" />
            Sold
          </span>
          <span className="inline-flex items-center gap-1.5">
            <PinSwatch kind="current" />
            For sale
          </span>
        </div>
      </div>

      <div className="map-shell relative overflow-hidden border border-line">
        <div
          ref={containerRef}
          className="w-full"
          style={{ height: "min(72vh, 620px)", minHeight: "360px" }}
        />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center bg-paper text-sm text-ink-soft">
            Loading map…
          </div>
        )}
        {ready && visible.length === 0 && (
          <div className="absolute inset-0 grid place-items-center bg-paper/90 px-6 text-center text-sm text-ink-soft">
            No pins in this view yet.
          </div>
        )}
        {gestureHint && (
          <p className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur">
            Scroll to zoom · click map again to lock
          </p>
        )}
        <p className="pointer-events-none absolute bottom-3 left-3 hidden rounded-full bg-white/90 px-3 py-1.5 text-[11px] text-ink-soft shadow-sm sm:block">
          Pinch or use + / − to zoom
        </p>
      </div>

      <p className="mt-3 text-sm text-ink-soft">
        Showing{" "}
        <span className="font-medium text-ink">{visible.length}</span>{" "}
        {mode === "sold" ? "sold" : "for-sale"} pin
        {visible.length === 1 ? "" : "s"}
        {mode === "sold"
          ? " — yellow pins mark completed sales across the Shore."
          : " — dark pins mark homes currently for sale."}
      </p>
    </div>
  );
}
