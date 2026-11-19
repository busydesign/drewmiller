import { extractRayWhiteListingRef } from "@/lib/listing-import/raywhite-source-id";

function listingFromPayload(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== "object") return null;
  const root = json as {
    data?: Array<{ value?: Record<string, unknown> }>;
    contents?: string;
    id?: unknown;
  };
  const direct = root.data?.[0]?.value;
  if (direct && typeof direct === "object" && Number(direct.id) > 0) {
    return direct;
  }
  if (typeof root.contents === "string") {
    try {
      return listingFromPayload(JSON.parse(root.contents));
    } catch {
      return null;
    }
  }
  if (Number(root.id) > 0) return root as Record<string, unknown>;
  return null;
}

/** Fetch a Ray White listing from the agent’s browser when Railway is CloudFront-blocked. */
export async function fetchRayWhiteListingInBrowser(
  sourceUrl: string
): Promise<Record<string, unknown> | null> {
  const ref = extractRayWhiteListingRef(sourceUrl);
  if (!ref) return null;

  const field = ref.kind === "sourceId" ? "sourceId" : "id";
  const apiUrls = [
    `https://rwmairangibay.co.nz/api/proxy/v1/listings?q=${field}:${ref.value}`,
    `https://www.rwmairangibay.co.nz/api/proxy/v1/listings?q=${field}:${ref.value}`,
  ];
  const urls = apiUrls.flatMap((apiUrl) => [
    apiUrl,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`,
  ]);

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json,text/plain,*/*" },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as unknown;
      const listing = listingFromPayload(json);
      if (listing) return listing;
    } catch {
      /* CORS or proxy blip — try the next candidate */
    }
  }

  return null;
}

export function isRayWhiteBlockedError(message: string | undefined): boolean {
  if (!message) return false;
  return /403|blocked|cloudfront|could not load that page/i.test(message);
}
