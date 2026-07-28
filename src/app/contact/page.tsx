import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import {
  ContactMethods,
  type ContactMethod,
} from "@/components/ContactMethods";
import { HERO_IMAGE, RAY_WHITE_PROFILE_URL } from "@/lib/agent-proof";
import { BRAND } from "@/lib/brand";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Drew Miller for buying, selling, or an appraisal on Auckland’s North Shore.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [settings, drew] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.agent.findFirst({
      where: { isLead: true, published: true },
      select: { phone: true, email: true },
    }),
  ]);

  const phone = settings?.phone || drew?.phone || BRAND.phoneDisplay;
  const email = BRAND.email;
  const agency = settings?.agencyName || BRAND.agencyName;
  const phoneHref = phone.replace(/\s+/g, "");

  const methods: ContactMethod[] = [
    {
      label: "Phone",
      value: phone,
      href: `tel:${phoneHref}`,
      icon: "phone",
      hint: "Call or text anytime",
    },
    {
      label: "Email",
      value: `${BRAND.emailName} · ${email}`,
      href: `mailto:${email}`,
      icon: "mail",
      hint: "We usually reply the same day",
    },
    {
      label: "Office",
      value: agency,
      href: RAY_WHITE_PROFILE_URL,
      icon: "map",
      hint: "Mairangi Bay & Milford · North Shore",
      external: true,
    },
  ];

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
          <div className="space-y-3">
            <ContactMethods methods={methods} />

            <div className="rounded-xl bg-mist p-7 md:p-9">
              <p className="eyebrow">Next step</p>
              <h2 className="display mt-2 text-3xl md:text-4xl">
                Prefer a clear starting point?
              </h2>
              <p className="mt-4 text-ink-soft">
                Share your address and we’ll come back with local sold context,
                timing advice, and a straight recommendation — no pressure.
              </p>
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

          <ContactForm />
        </div>
      </section>
    </>
  );
}
