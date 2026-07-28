declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Fire GA4 events from client components. Matches the key events
 *  already configured in GA4 Admin → Events → Key events:
 *  contact_form | request_appraisal | phone_call___advertising | email_link__click
 */
export function trackGaEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params ?? {});
}
