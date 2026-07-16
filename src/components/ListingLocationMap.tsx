"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  address: string;
  latitude: number;
  longitude: number;
  className?: string;
};

export function ListingLocationMap({
  address,
  latitude,
  longitude,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    async function mount() {
      try {
        const leaflet = await import("leaflet");
        const L = leaflet.default ?? leaflet;
        await import("leaflet/dist/leaflet.css");
        if (cancelled || !containerRef.current) return;

        // Avoid remounting into a container Leaflet already initialized
        containerRef.current.innerHTML = "";

        map = L.map(containerRef.current, {
          scrollWheelZoom: false,
        }).setView([latitude, longitude], 15);

        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            attribution: "&copy; OpenStreetMap &copy; CARTO",
            maxZoom: 19,
          }
        ).addTo(map);

        L.circleMarker([latitude, longitude], {
          radius: 9,
          color: "#111111",
          weight: 2,
          fillColor: "#ffe512",
          fillOpacity: 0.95,
        })
          .addTo(map)
          .bindPopup(`<strong>${address}</strong>`);

        if (!cancelled) setReady(true);

        // Layout can settle after sticky sidebar / fonts — refresh size
        const refresh = () => map?.invalidateSize();
        requestAnimationFrame(refresh);
        setTimeout(refresh, 150);
        setTimeout(refresh, 400);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load map");
        }
      }
    }

    mount();
    return () => {
      cancelled = true;
      map?.remove();
      map = null;
    };
  }, [address, latitude, longitude]);

  return (
    <div className={`mt-10 ${className}`}>
      <p className="eyebrow">Location</p>
      <h2 className="display mt-2 text-3xl">Where you’ll find it</h2>
      <div className="map-shell relative mt-5 border border-line">
        <div
          ref={containerRef}
          className="h-[280px] w-full md:h-[340px]"
          style={{ height: 320 }}
        />
        {!ready && !error && (
          <div className="absolute inset-0 grid place-items-center bg-paper text-sm text-ink-soft">
            Loading map…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center bg-paper px-4 text-center text-sm text-ink-soft">
            {error}
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-ink-soft">{address}</p>
    </div>
  );
}
