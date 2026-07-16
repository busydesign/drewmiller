import { detectListingImportSource } from "@/lib/listing-import/detect-source";
import { parseHomesCoNz } from "@/lib/listing-import/parse-homes";
import { parseRayWhite } from "@/lib/listing-import/parse-raywhite";
import {
  metaContent,
  metaNameContent,
} from "@/lib/listing-import/parse-meta";
import type { ListingImportPreview } from "@/lib/listing-import/types";

const FETCH_TIMEOUT_MS = 20_000;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function parseGenericMeta(html: string, sourceUrl: string): ListingImportPreview {
  const source = detectListingImportSource(sourceUrl);
  const ogTitle = metaContent(html, "og:title");
  const ogImage = metaContent(html, "og:image");
  const metaDesc = metaNameContent(html, "description");

  const title =
    ogTitle?.replace(/\s*[-|]\s*[^|]+$/, "").trim() || "Imported property";

  return {
    source,
    sourceUrl,
    title,
    propertyAddress: title,
    description: metaDesc,
    galleryUrls: ogImage ? [ogImage.split("?")[0]] : [],
    hints: {},
  };
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-NZ,en;q=0.9",
      },
      cache: "no-store",
      // @ts-expect-error Node fetch TLS option used in some runtimes
      rejectUnauthorized: false,
    });
    if (!res.ok) {
      throw new Error(`Could not load that page (${res.status}).`);
    }
    const html = await res.text();
    if (html.length < 800) {
      throw new Error(
        "The listing page returned almost no content — Ray White may have blocked the request. Try again in a moment."
      );
    }
    return html;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Request timed out — try again.");
    }
    throw e instanceof Error ? e : new Error("Could not fetch listing page");
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchListingPreview(
  sourceUrl: string
): Promise<ListingImportPreview> {
  const trimmed = sourceUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("Enter a full link starting with https://");
  }

  const source = detectListingImportSource(trimmed);
  if (source === "unknown") {
    throw new Error(
      "Paste a property link from Ray White, homes.co.nz, Trade Me, or OneRoof."
    );
  }

  // Prefer Ray White — richest source for Drew’s listings
  if (source === "raywhite.co.nz") {
    const html = await fetchHtml(trimmed);
    return parseRayWhite(html, trimmed);
  }

  const html = await fetchHtml(trimmed);

  if (source === "homes.co.nz") {
    return parseHomesCoNz(html, trimmed);
  }

  const generic = parseGenericMeta(html, trimmed);
  if (generic.galleryUrls.length === 0 && !generic.description) {
    throw new Error(
      `${source} preview is limited — a Ray White property URL gives the fullest import (photos, copy, price, beds/baths).`
    );
  }
  return generic;
}
