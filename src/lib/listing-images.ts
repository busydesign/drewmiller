/**
 * Squarespace migration leftovers that should never be used as covers.
 * Includes solid Ray White blue placeholders (`blue_*.jpg`, `blue_box_*`)
 * and screenshot captures.
 */
const JUNK_IMAGE_RE =
  /(?:^|\/)(?:blue(?:_box)?_[^/]*|Capture_[^/]*|16cgatman_cb400054)(?:\.[a-z]+)?$/i;

export function isJunkMigrationImage(url: string | null | undefined): boolean {
  if (!url) return true;
  return JUNK_IMAGE_RE.test(url.split("?")[0] ?? url);
}

/** Prefer a real photo over placeholder / screenshot covers. */
export function pickCoverImage(
  coverImageUrl: string | null | undefined,
  galleryUrls: Array<string | null | undefined> = []
): string | null {
  const candidates = [coverImageUrl, ...galleryUrls].filter(
    (u): u is string => Boolean(u)
  );
  return candidates.find((u) => !isJunkMigrationImage(u)) ?? null;
}
