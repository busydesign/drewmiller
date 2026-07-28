"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { trackGaEvent } from "@/lib/ga-events";

const ICONS = {
  phone: Phone,
  mail: Mail,
  map: MapPin,
} as const;

export type ContactMethodIcon = keyof typeof ICONS;

export type ContactMethod = {
  label: string;
  value: string;
  href: string;
  hint: string;
  icon: ContactMethodIcon;
  external?: boolean;
};

type ContactMethodsProps = {
  methods: ContactMethod[];
};

/**
 * Contact method cards on /contact with GA4 click tracking.
 * Kept as a client component so events can fire while the page stays a
 * server component for Prisma data fetching.
 */
export function ContactMethods({ methods }: ContactMethodsProps) {
  function getGaEvent(href: string) {
    if (href.startsWith("tel:")) return "phone_call___advertising";
    if (href.startsWith("mailto:")) return "email_link__click";
    return null;
  }

  return (
    <div data-reveal-stagger className="space-y-3">
      {methods.map((method) => {
        const Icon = ICONS[method.icon];
        const external = method.external ?? false;
        const gaEvent = getGaEvent(method.href);

        return (
          <a
            key={method.label}
            href={method.href}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            onClick={() => {
              if (gaEvent) {
                trackGaEvent(gaEvent, { link_location: "contact_page" });
              }
            }}
            className="group flex items-start gap-4 rounded-xl bg-mist px-5 py-5 transition hover:bg-[#ececec]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper text-ink">
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] text-muted">{method.label}</span>
              <span className="mt-0.5 block text-base font-medium tracking-tight text-ink transition group-hover:opacity-80">
                {method.value}
              </span>
              <span className="mt-1 block text-sm text-muted">{method.hint}</span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
