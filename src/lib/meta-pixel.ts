declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Fire Meta Pixel standard events from client components. */
export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  if (params) window.fbq("track", event, params);
  else window.fbq("track", event);
}
