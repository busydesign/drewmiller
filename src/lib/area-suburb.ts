/**
 * Derive a suburb label from an AREA content page slug/title so we can
 * match live listings (e.g. bayview-real-estate-agents → "Bayview").
 */
export function suburbNameFromAreaPage(
  slug: string,
  title?: string | null
): string {
  const fromTitle = (title || "")
    .replace(/real\s*estate\s*agents?/gi, "")
    .replace(/drew\s*miller/gi, "")
    .replace(/[-–—|:].*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (
    fromTitle.length >= 3 &&
    !/^agents?$/i.test(fromTitle) &&
    !/real estate/i.test(fromTitle)
  ) {
    return titleCase(fromTitle);
  }

  const fromSlug = slug
    .replace(/-\d+$/, "")
    .replace(/^real-estate-agents?-/, "")
    .replace(/-real-estate-agents?$/, "")
    .replace(/-/g, " ")
    .trim();

  return titleCase(fromSlug);
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
