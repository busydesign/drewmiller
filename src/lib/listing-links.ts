export type ListingLink = {
  label: string;
  url: string;
};

export function normalizeListingUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function labelForListingLink(
  url: string,
  customLabel?: string | null
): string {
  const custom = customLabel?.trim();
  if (custom) return custom;

  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "vaultre.com.au" || host.endsWith(".vaultre.com.au")) {
      return "Property information";
    }
    if (
      host.includes("raywhite") ||
      (host.startsWith("rw") && host.endsWith(".co.nz"))
    ) {
      return "View on Ray White";
    }
    if (host === "trademe.co.nz" || host.endsWith(".trademe.co.nz")) {
      return "View on Trade Me";
    }
    if (host === "homes.co.nz") return "View on homes.co.nz";
    if (host === "oneroof.co.nz") return "View on OneRoof";
    return `View on ${host}`;
  } catch {
    return "More details";
  }
}

export function parseListingLinks(value: unknown): ListingLink[] | null {
  if (!Array.isArray(value)) return null;

  const seen = new Set<string>();
  const links: ListingLink[] = [];

  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const urlRaw = String((row as { url?: unknown }).url || "");
    const labelRaw = String((row as { label?: unknown }).label || "");
    const url = normalizeListingUrl(urlRaw);
    if (!urlRaw.trim()) continue;
    if (!url) return null;
    if (seen.has(url)) continue;
    seen.add(url);
    links.push({
      label: labelForListingLink(url, labelRaw),
      url,
    });
  }

  return links;
}
