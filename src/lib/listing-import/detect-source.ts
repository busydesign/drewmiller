import type { ListingImportSource } from "@/lib/listing-import/types";

export function detectListingImportSource(url: string): ListingImportSource {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "homes.co.nz") return "homes.co.nz";
    if (host === "trademe.co.nz" || host.endsWith(".trademe.co.nz")) {
      return "trademe.co.nz";
    }
    if (host === "oneroof.co.nz") return "oneroof.co.nz";
    if (
      host === "raywhite.co.nz" ||
      host.endsWith(".raywhite.co.nz") ||
      host.startsWith("rw") ||
      host.includes("raywhite")
    ) {
      return "raywhite.co.nz";
    }
    if (host === "vaultre.com.au" || host.endsWith(".vaultre.com.au")) {
      return "vaultre.com.au";
    }
  } catch {
    /* invalid URL */
  }
  return "unknown";
}

export const SUPPORTED_LISTING_IMPORT_HOSTS = [
  "homes.co.nz",
  "trademe.co.nz",
  "oneroof.co.nz",
  "raywhite.co.nz",
  "vaultre.com.au",
] as const;
