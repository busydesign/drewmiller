import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { HERO_IMAGE, RAY_WHITE_PROFILE_URL } from "@/lib/agent-proof";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Drew Miller for buying, selling, or an appraisal on Auckland’s North Shore.",
};

const FALLBACK_PHONE = "021 963 654";
const FALLBACK_EMAIL = "drew.miller@raywhite.com";
const FALLBACK_AGENCY = "Ray White Mairangi Bay & Milford";

export default async function ContactPage() {
  const [settings, drew] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.agent.findFirst({
      where: { isLead: true, published: true },
      select: { phone: true, email: true },
    }),
  ]);

  const phone = settings?.phone || drew?.phone || FALLBACK_PHONE;
  const email = settings?.email || drew?.email || FALLBACK_EMAIL;
  const agency = settings?.agencyName || FALLBACK_AGENCY;
  const phoneHref = phone.replace(/\s+/g, "");

  const methods = [
    {
      label: "Phone",
      value: phone,
      href: `tel:${phoneHref}`,
      icon: Phone,
      hint: "Call or text anytime",
    },
    {
      label: "Email",
      value: email,
      href: `mailto:${email}`,
      icon: Mail,
      hint: "We usually reply the same day",
    },
    {
      label: "Office",
      value: agency,
      href: RAY_WHITE_PROFILE_URL,
      icon: MapPin,
      hint: "Mairangi Bay & Milford · North Shore",
      external: true,
    },
  ] as const;

  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="shell grid items-end gap-10 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
          <div>
            <p className="eyebrow">Contact</p>
            <h1 className="display mt-2 text-5xl md:text-6xl">Let’s talk</h1>
            <p className="mt-5 max-w-xl text-base text-ink-soft md:text-lg">
              Buying, selling, or just wanting a clear read on the North Shore
              market — reach out directly, or start with an appraisal request.
            </p>
          </div>
          <div className="relative hidden min-h-[220px] overflow-hidden rounded-xl bg-mist md:block">
            <Image
              src={HERO_IMAGE}
              alt="Drew Miller and team"
              fill
              className="object-cover object-[center_25%]"
              sizes="40vw"
              priority
            />
          </div>
        </div>
      </section>

      <section className="section bg-paper">
        <div className="shell grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div data-reveal-stagger className="space-y-3">
            {methods.map((method) => {
              const Icon = method.icon;
              const external = "external" in method && method.external;
              return (
                <a
                  key={method.label}
                  href={method.href}
                  {...(external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                  className="group flex items-start gap-4 rounded-xl bg-mist px-5 py-5 transition hover:bg-[#ececec]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper text-ink">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] text-muted">
                      {method.label}
                    </span>
                    <span className="mt-0.5 block text-base font-medium tracking-tight text-ink transition group-hover:opacity-80">
                      {method.value}
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {method.hint}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>

          <div className="flex flex-col justify-between rounded-xl bg-mist p-7 md:p-9">
            <div>
              <p className="eyebrow">Next step</p>
              <h2 className="display mt-2 text-3xl md:text-4xl">
                Prefer a clear starting point?
              </h2>
              <p className="mt-4 text-ink-soft">
                Share your address and we’ll come back with local sold context,
                timing advice, and a straight recommendation — no pressure.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-ink-soft">
                <li className="flex gap-2">
                  <span className="text-muted">—</span>
                  Direct line to Drew and the team
                </li>
                <li className="flex gap-2">
                  <span className="text-muted">—</span>
                  Recent sales around your street
                </li>
                <li className="flex gap-2">
                  <span className="text-muted">—</span>
                  Clear next steps for buying or selling
                </li>
              </ul>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/appraisal" className="btn btn-primary">
                Request appraisal
              </Link>
              <Link href="/map" className="btn btn-secondary">
                Open sales map
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
