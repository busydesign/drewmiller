/** MRG35427, L10279669, H3526278, etc. from Ray White property URLs. */
export function extractRayWhiteSourceId(url: string): string | null {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i];
      if (/^[A-Z]+\d+$/i.test(segment)) {
        return segment.toUpperCase();
      }
    }
  } catch {
    /* invalid URL */
  }
  return null;
}
