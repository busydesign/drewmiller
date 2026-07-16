import { decodeHtmlEntities } from "@/lib/listing-import/decode-html";
import {
  isRayWhiteOfficeHtml,
  parseRayWhiteOffice,
} from "@/lib/listing-import/parse-raywhite-office";
import {
  metaContent,
  metaNameContent,
} from "@/lib/listing-import/parse-meta";
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

function metaCount(html: string, icon: string): number | null {
  const re = new RegExp(
    `icon-solid-${icon}[\\s\\S]{0,200}?property-meta__item__count">\\s*(\\d+)`,
    "i"
  );
  const raw = html.match(re)?.[1];
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseAddress(html: string, sourceUrl: string): string {
  const h1 = html.match(/<h1[^>]*>\s*([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) {
    const text = cleanText(
      h1.replace(/<br\s*\/?>/gi, ", ").replace(/<[^>]+>/g, " ")
    );
    if (text.length > 5) return text.replace(/\s*,\s*$/, "");
  }

  const ogTitle = metaContent(html, "og:title");
  if (ogTitle) {
    return ogTitle
      .replace(/\s*[–—-]\s*Home For Sale.*$/i, "")
      .replace(/\s*,\s*$/, "")
      .trim();
  }

  try {
    const parts = new URL(sourceUrl).pathname.split("/").filter(Boolean);
    const suburb = parts[parts.length - 2]?.replace(/-/g, " ");
    return suburb
      ? suburb.replace(/\b\w/g, (c) => c.toUpperCase())
      : "Ray White listing";
  } catch {
    return "Ray White listing";
  }
}

function parseRayWhiteMain(
  html: string,
  sourceUrl: string
): ListingImportPreview {
  if (html.length < 5000 || !/property-detail/i.test(html)) {
    throw new Error(
      "Couldn’t read that Ray White page. Open the individual property URL (e.g. …/murrays-bay/MRG34881 or an rwmairangibay.co.nz property link), then try again."
    );
  }

  const propertyAddress = parseAddress(html, sourceUrl);

  const headline = cleanText(
    (
      html.match(
        /<h2[^>]*class="[^"]*property-detail__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i
      )?.[1] || ""
    ).replace(/<[^>]+>/g, "")
  );

  const bodyHtml =
    html
      .match(
        /<div class="property-detail__body">[\s\S]*?<div class="rich-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i
      )?.[1]
      ?.trim() || "";

  const bodyMarkdown = stripTags(
    bodyHtml ||
      metaContent(html, "og:description") ||
      metaNameContent(html, "description") ||
      ""
  );

  const listedPriceLabel =
    cleanText(
      html.match(/property-detail__banner__side__price">\s*([^<]+)/i)?.[1] ||
        ""
    ) || null;

  const labels = [
    ...html.matchAll(
      /property-detail__banner__specs__item__label[^>]*>([\s\S]*?)<\/div>/gi
    ),
  ].map((m) => cleanText(m[1]));
  const values = [
    ...html.matchAll(
      /property-detail__banner__specs__item__value[^>]*>([\s\S]*?)<\/div>/gi
    ),
  ].map((m) => cleanText(m[1]));

  const specs = new Map<string, string>();
  labels.forEach((label, i) => {
    if (values[i]) specs.set(label.toLowerCase(), values[i]);
  });

  const galleryUrls = [
    ...new Set(
      (
        html.match(
          /https:\/\/cdn6\.ep\.dynamics\.net\/s3\/rw-propertyimages\/[^"'?\s]+/g
        ) || []
      ).map((u) => u.replace(/&amp;/g, "&"))
    ),
  ];

  const ogImage = metaContent(html, "og:image")?.split("?")[0];
  if (ogImage && !galleryUrls.includes(ogImage)) {
    galleryUrls.unshift(ogImage);
  }

  const coord = html.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/i);
  const building = specs.get("building") || null;
  const land = specs.get("land") || null;
  const propertyType = specs.get("property type") || "House";

  const description =
    [headline, bodyMarkdown].filter(Boolean).join("\n\n") || null;

  const summaryBits = [
    headline || null,
    listedPriceLabel,
    building ? `Building ${building}` : null,
    land ? `Land ${land}` : null,
  ].filter(Boolean);

  return {
    source: "raywhite.co.nz",
    sourceUrl,
    title: headline || propertyAddress,
    propertyAddress,
    description,
    bodyHtml: bodyHtml || null,
    bodyMarkdown: bodyMarkdown || null,
    summary: summaryBits.join(" · ") || null,
    galleryUrls,
    status: /sold/i.test(listedPriceLabel || "") ? "SOLD" : "FOR_SALE",
    listedPriceLabel,
    propertyType,
    buildingArea: building,
    landArea: land,
    latitude: coord ? Number(coord[1]) : null,
    longitude: coord ? Number(coord[2]) : null,
    hints: {
      bedrooms: metaCount(html, "bed"),
      bathrooms: metaCount(html, "bath"),
      parking: metaCount(html, "car"),
      agentName: "Drew Miller",
      agencyName: "Ray White Mairangi Bay",
      listedPriceLabel,
      buildingArea: building,
      landArea: land,
      propertyType,
    },
  };
}

/** Full Ray White parser — national site + office sites (rw*.co.nz). */
export function parseRayWhite(
  html: string,
  sourceUrl: string
): ListingImportPreview {
  if (isRayWhiteOfficeHtml(html)) {
    const office = parseRayWhiteOffice(html, sourceUrl);
    if (office) return office;
  }
  return parseRayWhiteMain(html, sourceUrl);
}
