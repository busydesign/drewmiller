export type RayWhiteListingRef =
  | { kind: "sourceId"; value: string }
  | { kind: "id"; value: string };

/** MRG35427, L10279669, or numeric office ids like …/house/3565030. */
export function extractRayWhiteListingRef(url: string): RayWhiteListingRef | null {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);

    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i];
      if (/^[A-Z]+\d+$/i.test(segment)) {
        return { kind: "sourceId", value: segment.toUpperCase() };
      }
    }

    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i];
      const prev = segments[i - 1]?.toLowerCase();
      if (/^\d{5,}$/.test(segment)) {
        if (
          !prev ||
          /^(house|unit|apartment|townhouse|section|land|property|listing)$/.test(
            prev
          )
        ) {
          return { kind: "id", value: segment };
        }
      }
    }

    const last = segments[segments.length - 1];
    if (last && /^\d{5,}$/.test(last)) {
      return { kind: "id", value: last };
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

/** @deprecated Use extractRayWhiteListingRef */
export function extractRayWhiteSourceId(url: string): string | null {
  const ref = extractRayWhiteListingRef(url);
  return ref?.kind === "sourceId" ? ref.value : null;
}
