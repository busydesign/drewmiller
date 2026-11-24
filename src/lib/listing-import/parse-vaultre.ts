import { decodeHtmlEntities } from "@/lib/listing-import/decode-html";
import { metaContent } from "@/lib/listing-import/parse-meta";
import { extractRayWhiteListingRef } from "@/lib/listing-import/raywhite-source-id";
import { labelForListingLink } from "@/lib/listing-links";
import type { ListingImportPreview } from "@/lib/listing-import/types";

function cleanText(s: string) {
  return decodeHtmlEntities(s).replace(/\s+/g, " ").trim();
}

function stripTags(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function classHtml(html: string, className: string): string | null {
  const re = new RegExp(
    `<[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)</`,
    "i"
  );
  return html.match(re)?.[1] ?? null;
}

function classText(html: string, className: string): string | null {
  const inner = classHtml(html, className);
  if (!inner) return null;
  const text = cleanText(inner.replace(/<[^>]+>/g, " "));
  return text || null;
}

/** "2 Akau Lane Wainui" → "2 Akau Lane, Wainui" when VaultRE omits commas. */
export function formatVaultAddress(raw: string): string {
  const text = cleanText(raw);
  if (!text || text.includes(",")) return text;
  const m = text.match(/^(\d+\S*(?:\/\d+\S*)?)\s+(.+)\s+(\S+)$/);
  if (!m) return text;
  return `${m[1]} ${m[2]}, ${m[3]}`;
}

function iconCount(html: string, file: string): number | null {
  const re = new RegExp(`${file}[^>]*>\\s*(\\d+)`, "i");
  const raw = html.match(re)?.[1];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function extractGallery(html: string): string[] {
  const carousel =
    html.match(
      /id=["']myCarousel["'][\s\S]*?class=["']carousel-inner["'][\s\S]*?<\/div>\s*<\/div>/i
    )?.[0] || html;
  const urls: string[] = [];
  const seen = new Set<string>();
  const re = /https:\/\/propertyphotos\.vaultre\.com\.au\/[^"'\s>]+/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(carousel))) {
    const url = decodeHtmlEntities(match[0])
      .replace(/[.,;]+$/, "")
      .split("?")[0];
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

function extractRayWhiteUrl(html: string): string | null {
  const hrefs = [
    ...html.matchAll(
      /href=["'](https?:\/\/[^"']+)["']/gi
    ),
  ].map((row) => decodeHtmlEntities(row[1]));
  const texts = [
    ...html.matchAll(
      /https?:\/\/(?:www\.)?(?:rw[a-z0-9-]*\.co\.nz|[^"'<\s]*raywhite[^"'<\s]*)\/[^\s"'<]+/gi
    ),
  ].map((row) => decodeHtmlEntities(row[0]));

  for (const candidate of [...hrefs, ...texts]) {
    if (extractRayWhiteListingRef(candidate)) return candidate;
  }
  return null;
}

export function parseVaultRe(
  html: string,
  sourceUrl: string
): ListingImportPreview {
  const propertyAddress = formatVaultAddress(
    classText(html, "propertyaddress") ||
      metaContent(html, "og:title") ||
      "Imported property"
  );
  const headline = classText(html, "propertyheading");
  const descriptionHtml = classHtml(html, "propertydescription");
  const bodyHtml = descriptionHtml
    ? descriptionHtml.replace(/\r\n/g, "\n").trim()
    : null;
  const bodyMarkdown = bodyHtml ? stripTags(bodyHtml) : null;
  const galleryUrls = extractGallery(html);
  const rayWhiteUrl = extractRayWhiteUrl(html);
  const rwRef = rayWhiteUrl ? extractRayWhiteListingRef(rayWhiteUrl) : null;
  const externalId =
    rwRef?.kind === "sourceId"
      ? rwRef.value
      : rwRef?.kind === "id"
        ? `rw:${rwRef.value}`
        : null;

  const description = [headline, bodyMarkdown].filter(Boolean).join("\n\n") || null;

  return {
    source: "vaultre.com.au",
    sourceUrl: rayWhiteUrl || sourceUrl,
    title: headline || propertyAddress,
    propertyAddress,
    description,
    bodyHtml,
    bodyMarkdown,
    summary: headline || null,
    galleryUrls,
    listedPriceLabel: null,
    omitListedPrice: true,
    propertyType: "House",
    extraLinks: [
      {
        label: labelForListingLink(sourceUrl),
        url: sourceUrl,
      },
    ],
    hints: {
      bedrooms: iconCount(html, "bed\\.png"),
      bathrooms: iconCount(html, "shower\\.png"),
      parking: iconCount(html, "car\\.png"),
      listedPriceLabel: null,
      externalId,
      agencyName: "Ray White Mairangi Bay",
      propertyType: "House",
    },
  };
}
