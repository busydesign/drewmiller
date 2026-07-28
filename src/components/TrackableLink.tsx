"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { trackGaEvent } from "@/lib/ga-events";

interface TrackableLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  gaEvent: string;
  gaParams?: Record<string, unknown>;
}

/**
 * Drop-in replacement for <a> that fires a GA4 event on click.
 * Use this in server components (SiteFooter, contact page) where you
 * can't add onClick directly.
 */
export function TrackableLink({
  gaEvent,
  gaParams,
  onClick,
  children,
  ...rest
}: TrackableLinkProps) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    trackGaEvent(gaEvent, gaParams);
    onClick?.(e);
  }

  return (
    <a onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
