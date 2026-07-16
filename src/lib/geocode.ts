/** Geocode NZ-oriented addresses via OpenStreetMap Nominatim (server-side only). */

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

const USER_AGENT = "DrewMillerSite/1.0 (property map; +https://www.drewmiller.co.nz)";

type NominatimRow = {
  lat?: string;
  lon?: string;
  display_name?: string;
  class?: string;
  type?: string;
  importance?: number;
  address?: Record<string, string>;
};

/** First segment house token: "1/18", "18A", "16", etc. */
export function extractHouseToken(address: string): string | null {
  const head = address.trim().split(",")[0]?.trim() ?? "";
  const m = head.match(/^(\d+\s*\/\s*\d+[A-Za-z]?|\d+[A-Za-z]?|\d+\/\d+[A-Za-z]?)/);
  return m ? m[1].replace(/\s+/g, "") : null;
}

function normalizeHouseToken(token: string): string {
  return token.replace(/\s+/g, "").toLowerCase();
}

/** Greater Auckland / North Shore focus — reject East Cape etc. */
function isInAucklandRegion(lat: number, lon: number): boolean {
  return lat >= -37.1 && lat <= -36.2 && lon >= 174.35 && lon <= 175.15;
}

function scoreNominatimHit(row: NominatimRow, soughtHouse: string | null): number {
  const addr = row.address ?? {};
  const houseNumber = (addr.house_number ?? "").replace(/\s+/g, "");
  let score = (row.importance ?? 0) * 5;

  const lat = Number.parseFloat(row.lat ?? "");
  const lon = Number.parseFloat(row.lon ?? "");
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    if (!isInAucklandRegion(lat, lon)) score -= 400;
  }

  if (row.class === "place" && row.type === "house") score += 120;
  else if (row.class === "building") score += 90;
  else if (row.type === "house") score += 70;
  else if (row.class === "highway" || row.type === "residential") score -= 60;
  else if (row.class === "highway") score -= 40;

  if (!houseNumber) score -= 35;

  if (soughtHouse) {
    const sought = normalizeHouseToken(soughtHouse);
    const hn = normalizeHouseToken(houseNumber);
    if (hn && (hn === sought || hn.includes(sought) || sought.includes(hn))) {
      score += 200;
    } else if (houseNumber) {
      score -= 50;
    }
  }

  return score;
}

/** Clean noisy sale/listing labels before geocoding. */
export function normalizeGeocodeAddress(address: string): string {
  let s = address.trim();
  s = s.replace(/\s*[-–.]?\s*case\s*study\s*$/i, "");
  s = s.replace(/\bTotara Value\b/gi, "Totara Vale");
  s = s.replace(/\bCoranation\b/gi, "Coronation");
  s = s.replace(/\bSycamore\s*$/i, "Glenfield");
  s = s.replace(/\bOteha\s*\/\s*Albany\b/gi, "Oteha");
  s = s.replace(/\bNorth Shore City,?\s*/gi, "");
  s = s.replace(/\bHononga Road\b/gi, "Hononga Lane");
  s = s.replace(/\bSalamanca Drive\b/gi, "Salamanca Road");
  s = s.replace(/\bWolsley\b/gi, "Wolseley");
  // Unit spacing: "1/ 13" → "1/13", "1 + 2 /85" → "1/85"
  s = s.replace(/(\d+)\s*\/\s*(\d+)/g, "$1/$2");
  s = s.replace(/(\d+)\s*\+\s*(\d+)\s*\/\s*(\d+)/g, "$1/$3");
  s = s.replace(/\bLOT\s+(\d+)\s+/i, "");
  s = s.replace(/\s{2,}/g, " ").replace(/\s+,/g, ",").trim();
  return s;
}

function buildQueryVariants(address: string): string[] {
  const cleaned = normalizeGeocodeAddress(address);
  const variants: string[] = [];
  const push = (q: string) => {
    const t = q.trim();
    if (t && !variants.includes(t)) variants.push(t);
  };

  push(`${cleaned}, Auckland, New Zealand`);
  push(`${cleaned}, New Zealand`);

  const head = cleaned.split(",")[0]?.trim();
  const suburb = cleaned.split(",").slice(1).join(",").trim();
  if (head && /^\d+\//.test(head)) {
    const streetOnly = head.replace(/^\d+[A-Za-z]?\//, "").trim();
    if (streetOnly) {
      push(
        suburb
          ? `${streetOnly}, ${suburb}, Auckland, New Zealand`
          : `${streetOnly}, Auckland, New Zealand`
      );
    }
  }

  // High East Coast Road numbers sit in Silverdale / Hibiscus Coast
  if (
    head &&
    /east coast road/i.test(head) &&
    !/silverdale|stillwater|dairy flat|orewa|browns bay|sunnynook|milford|forrest hill|pinehill|mairangi|windsor/i.test(
      cleaned
    )
  ) {
    const house = extractHouseToken(head);
    const n = house ? Number.parseInt(house, 10) : NaN;
    if (Number.isFinite(n) && n >= 1500) {
      push(`${head}, Silverdale, Auckland, New Zealand`);
    }
  }

  if (head && /eban/i.test(cleaned) && !/hillcrest/i.test(cleaned)) {
    push(`${head}, Hillcrest, Auckland 0627, New Zealand`);
  }

  return variants;
}

let lastNominatimAt = 0;

async function nominatimSearch(query: string): Promise<NominatimRow[]> {
  // Respect Nominatim ~1 req/sec across the process
  const wait = Math.max(0, 1100 - (Date.now() - lastNominatimAt));
  if (wait) await new Promise((r) => setTimeout(r, wait));
  lastNominatimAt = Date.now();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "8");
  url.searchParams.set("countrycodes", "nz");
  url.searchParams.set("addressdetails", "1");
  // Bias toward Auckland / North Shore without hard-bounding
  url.searchParams.set("viewbox", "174.35,-36.2,175.15,-37.1");
  url.searchParams.set("bounded", "0");
  url.searchParams.set("q", query);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 },
    signal: AbortSignal.timeout(12_000),
  });

  if (res.status === 429) {
    // Back off hard, then one retry
    await new Promise((r) => setTimeout(r, 5000));
    lastNominatimAt = Date.now();
    const retry = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!retry.ok) return [];
    return (await retry.json()) as NominatimRow[];
  }

  if (!res.ok) return [];
  return (await res.json()) as NominatimRow[];
}

/** Komoot Photon fallback (same OSM data, separate rate limit). */
async function photonSearch(query: string): Promise<NominatimRow[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  url.searchParams.set("lang", "en");
  url.searchParams.set("lat", "-36.75");
  url.searchParams.set("lon", "174.74");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: {
        name?: string;
        street?: string;
        housenumber?: string;
        city?: string;
        district?: string;
        country?: string;
        type?: string;
        osm_value?: string;
        osm_key?: string;
      };
    }>;
  };

  return (data.features ?? [])
    .filter((f) => f.geometry?.coordinates?.length === 2)
    .filter((f) => {
      const c = f.properties?.country?.toLowerCase() ?? "";
      return !c || c.includes("zealand") || c === "nz";
    })
    .map((f) => {
      const [lon, lat] = f.geometry!.coordinates!;
      const props = f.properties ?? {};
      return {
        lat: String(lat),
        lon: String(lon),
        display_name: [props.name, props.street, props.city]
          .filter(Boolean)
          .join(", "),
        class: props.osm_key,
        type: props.osm_value ?? props.type,
        address: {
          house_number: props.housenumber ?? "",
          road: props.street ?? "",
          suburb: props.district ?? "",
          city: props.city ?? "",
        },
      } satisfies NominatimRow;
    });
}

export async function geocodePropertyAddress(
  address: string
): Promise<GeocodeResult | null> {
  const trimmed = normalizeGeocodeAddress(address);
  if (trimmed.length < 4) return null;

  const soughtHouse =
    extractHouseToken(trimmed) ?? extractHouseToken(address.trim());
  const variants = buildQueryVariants(address);

  let best: { row: NominatimRow; score: number } | null = null;

  for (const query of variants) {
    const rows = await nominatimSearch(query);
    for (const row of rows) {
      const score = scoreNominatimHit(row, soughtHouse);
      if (!best || score > best.score) {
        best = { row, score };
      }
    }
    if (best && best.score >= 150) break;
  }

  // Photon fallback when Nominatim is empty / rate-limited
  if (!best || best.score < 40) {
    for (const query of variants.slice(0, 2)) {
      const rows = await photonSearch(query);
      for (const row of rows) {
        const score = scoreNominatimHit(row, soughtHouse);
        if (!best || score > best.score) {
          best = { row, score };
        }
      }
      if (best && best.score >= 150) break;
    }
  }

  // Accept weaker street-level hits rather than dropping the pin entirely
  if (!best || best.score < 40 || !best.row.lat || !best.row.lon) return null;

  const latitude = Number.parseFloat(best.row.lat);
  const longitude = Number.parseFloat(best.row.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (!isInAucklandRegion(latitude, longitude)) return null;

  return {
    latitude,
    longitude,
    displayName: best.row.display_name ?? trimmed,
  };
}

export function openStreetMapEmbedUrl(lat: number, lon: number): string {
  const pad = 0.012;
  const bbox = [
    lon - pad,
    lat - pad,
    lon + pad,
    lat + pad,
  ].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
}

export function openStreetMapSearchUrl(address: string): string {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;
}
