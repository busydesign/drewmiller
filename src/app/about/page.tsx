import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RmaBadgeStrip } from "@/components/RmaBadgeStrip";
import {
  AGENT_STATS,
  HERO_IMAGE,
  RATE_MY_AGENT_URL,
  RAY_WHITE_ELITE_BADGE,
  RAY_WHITE_PROFILE_URL,
} from "@/lib/agent-proof";
import { BRAND } from "@/lib/brand";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "About Drew Miller",
  description:
    "Ray White Elite agent Drew Miller — 175+ North Shore sales, $205M+, Top 100 NZ agent.",
};

export default async function AboutPage() {
  const [settings, drew] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.agent.findFirst({
      where: { isLead: true, published: true },
      select: { phone: true, email: true },
    }),
  ]);

  const phone = settings?.phone || drew?.phone || BRAND.phoneDisplay;
  const email = BRAND.email;
  const phoneHref = phone.replace(/\s+/g, "");

  return (
    <section className="section">
      <div className="shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[420px] overflow-hidden bg-ink">
          <Image
            src={HERO_IMAGE}
            alt="Drew Miller"
            fill
            className="object-cover object-top"
            sizes="(max-width: 1024px) 100vw, 40vw"
            priority
          />
        </div>
        <div>
          <p className="eyebrow">About</p>
          <h1 className="display mt-2 text-5xl font-black md:text-6xl">
            {settings?.agentName || "Drew Miller"}
          </h1>
          <p className="mt-3 text-lg font-medium text-ink-soft">
            Ray White Mairangi Bay &amp; Milford · Elite Agent
          </p>
          <p className="prose-site mt-6">
            With more than a decade in real estate and a proven track record of{" "}
            {AGENT_STATS.salesCountLabel} successful sales totalling over{" "}
            {AGENT_STATS.salesVolumeLabel}, Drew has built his reputation on clear
            advice, sharp negotiation, and results. Recognised with Ray White Elite
            status and ranked among New Zealand’s Top 100 agents.
          </p>

          <div className="mt-7">
            <Image
              src={RAY_WHITE_ELITE_BADGE.image}
              alt={RAY_WHITE_ELITE_BADGE.alt}
              width={200}
              height={124}
              className="h-auto w-full max-w-[9.5rem] object-contain"
            />
          </div>

          <div className="mt-7 space-y-2 text-sm">
            <p>
              <span className="font-bold">Phone</span>{" "}
              <a className="underline" href={`tel:${phoneHref}`}>
                {phone}
              </a>
            </p>
            <p>
              <span className="font-bold">Email</span>{" "}
              <a className="underline" href={`mailto:${email}`}>
                {email}
              </a>
            </p>
            <p className="text-ink-soft">
              Ray White Mairangi Bay &amp; Milford · North Shore, Auckland
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/appraisal" className="btn btn-primary">
              Request appraisal
            </Link>
            <a
              href={settings?.rateMyAgentUrl || RATE_MY_AGENT_URL}
              className="btn btn-secondary"
              target="_blank"
              rel="noreferrer"
            >
              Client reviews
            </a>
            <a
              href={RAY_WHITE_PROFILE_URL}
              className="btn btn-secondary"
              target="_blank"
              rel="noreferrer"
            >
              Ray White profile
            </a>
          </div>

          <div className="mt-10">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-ink-soft">
              Awards
            </p>
            <RmaBadgeStrip showHeader={false} showDetails={false} compact />
          </div>
        </div>
      </div>
    </section>
  );
}
