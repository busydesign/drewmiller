import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { RmaBadgeStrip } from "@/components/RmaBadgeStrip";
import {
  HERO_IMAGE,
  RATE_MY_AGENT_URL,
  RAY_WHITE_ELITE_BADGE,
  RAY_WHITE_PROFILE_URL,
} from "@/lib/agent-proof";
import { BRAND } from "@/lib/brand";
import { prisma } from "@/lib/db";
import { realEstateAgentJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "About Drew Miller",
  description:
    "Ray White Elite Performer Drew Miller — North Shore coastal specialist. 182 confirmed sales, $213.5M career volume, Top 100 NZ agent.",
  alternates: { canonical: "/about" },
};

const ABOUT_PARAGRAPHS = [
  "Drew Miller is a Ray White Elite Performer and North Shore real estate specialist working from the Mairangi Bay and Milford offices.",
  "Over the last 12 months, Drew has sold 26 properties with a combined value of $31.1 million and a median time on the market of 31 days.",
  "Across the last 24 months, Drew has completed 48 sales, with 39 confirmed sales representing $44 million in value. Throughout his career, he has achieved 182 confirmed sales with a combined value of $213.5 million.",
  "Drew has been recognised among the top 3% of Ray White agents, named a RateMyAgent Top 100 Agent in New Zealand and received more than 135 five-star client reviews—including 26 reviews in the last year alone.",
  "Drew’s focus is Auckland’s North Shore coast, including Mairangi Bay, Milford, Takapuna and the surrounding seaside neighbourhoods. He works with family homes, significant coastal properties, beachfront and clifftop residences, development opportunities and owners preparing for their next stage of life.",
  "For Drew, achieving the best possible result begins well before the photography and marketing. Rather than rushing a property onto the market, he works with owners and the appropriate professionals to review the title, LIM, council property file, building consents and Code Compliance Certificates.",
  "Potential issues are identified early, allowing time to obtain missing information, resolve outstanding council matters or prepare clear documentation for prospective buyers. This reduces surprises during due diligence, gives buyers greater confidence and protects the seller’s negotiating position once offers are received.",
  "Selling a substantial family home is rarely a straightforward transaction. It may involve trusts, multiple family members, an onward purchase, downsizing or the need for complete confidentiality. Drew takes the time to understand the full situation before recommending a strategy.",
  "Rather than applying the same sales method to every property, he develops a plan around the home, its likely buyers and the owner’s priorities. This may range from a discreet approach to qualified buyers through to a comprehensive public campaign, deadline sale or competitive auction.",
  "A key part of Drew’s approach is creating genuine competition. He actively works with agents from across the market, follows up every buyer and ensures potential purchasers remain engaged. His sellers receive clear reporting, honest feedback and practical recommendations throughout their campaign.",
  "Although supported by an experienced team, Drew remains personally involved in the important parts of every sale: the preparation, strategy, buyer conversations, vendor communication and final negotiation.",
  "His clients value his straightforward advice, accessibility and determination to achieve the best possible outcome. Many of Drew’s sales and new listings come through repeat clients, referrals and recommendations from people who have experienced his service firsthand.",
  "Outside real estate, Drew is an avid boatie and has served for more than eight years on the executive committee of Milford Mariners. His connection to the North Shore coast extends well beyond property—this is the community and lifestyle he genuinely knows and values.",
  "If you are considering selling now, planning a future move or would simply like a confidential assessment of your property’s position in the market, contact Drew for a straightforward, evidence-based conversation.",
] as const;

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
      <JsonLd data={realEstateAgentJsonLd()} />
      <div className="shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[420px] overflow-hidden bg-ink lg:sticky lg:top-24 lg:self-start lg:min-h-[560px]">
          <Image
            src={HERO_IMAGE}
            alt="Drew Miller and the Ray White North Shore team"
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
            Ray White Mairangi Bay &amp; Milford · Elite Performer
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

          <div className="mt-12 space-y-5">
            {ABOUT_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="prose-site">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
