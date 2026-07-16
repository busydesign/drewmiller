import Image from "next/image";
import Link from "next/link";
import { HeroBanner } from "@/components/HeroBanner";
import { HorizontalSlider } from "@/components/HorizontalSlider";
import { ListingCard } from "@/components/ListingCard";
import { RmaBadgeStrip } from "@/components/RmaBadgeStrip";
import { SalesMapPromo } from "@/components/SalesMapPromo";
import { TeamGrid } from "@/components/TeamGrid";
import {
  AGENT_STATS,
  FEATURED_REVIEWS,
  RATE_MY_AGENT_URL,
  RAY_WHITE_ELITE_BADGE,
} from "@/lib/agent-proof";
import { prisma } from "@/lib/db";
import {
  agentsForCard,
  getCurrentTeamListings,
  listingCardInclude,
} from "@/lib/listings-query";

export default async function HomePage() {
  const [settings, currentListings, featured, listingCount, team, mappedSales] =
    await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
      getCurrentTeamListings(10),
      prisma.listing.findMany({
        where: { published: true, status: "SOLD" },
        orderBy: [{ soldDate: "desc" }, { updatedAt: "desc" }],
        take: 10,
        include: listingCardInclude,
      }),
      prisma.listing.count({ where: { published: true, status: "SOLD" } }),
      prisma.agent.findMany({
        where: { published: true },
        orderBy: [{ isLead: "desc" }, { sortOrder: "asc" }],
      }),
      prisma.sale.count({
        where: { latitude: { not: null }, longitude: { not: null } },
      }),
    ]);

  return (
    <>
      <HeroBanner>
        <div className="text-white">
          <p className="eyebrow fade-up !text-white/65">
            Ray White · Mairangi Bay &amp; Milford
          </p>
          <h1 className="display fade-up-delay mt-4 text-5xl font-medium md:text-7xl">
            Drew Miller
          </h1>
          <p className="fade-up-delay-2 mt-5 max-w-xl text-base text-white/75 md:text-lg">
            Elite North Shore agent. {AGENT_STATS.salesCountLabel} sales,{" "}
            {AGENT_STATS.salesVolumeLabel} — built on clear advice and results
            people talk about.
          </p>
          <div className="fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <Link href="/appraisal" className="btn btn-primary">
              Request an appraisal
            </Link>
            <Link href="/listings" className="btn btn-on-dark">
              Current listings
            </Link>
          </div>
        </div>
      </HeroBanner>

      <section className="border-b border-line bg-paper">
        <div
          data-reveal-stagger
          className="shell grid grid-cols-2 items-center py-8 md:grid-cols-5 md:py-10"
        >
          {[
            { label: "Successful sales", value: AGENT_STATS.salesCountLabel },
            { label: "Sales volume", value: AGENT_STATS.salesVolumeLabel },
            { label: "Client rating", value: "5.0" },
            { label: "Experience", value: AGENT_STATS.experienceLabel },
          ].map((item, index) => (
            <div
              key={item.label}
              className={`px-4 py-3 text-center md:px-5 md:py-0 md:text-left lg:px-6 ${
                index > 0 ? "md:border-l md:border-line" : ""
              } ${index >= 2 ? "border-t border-line md:border-t-0" : ""}`}
            >
              <p className="display text-2xl md:text-3xl">{item.value}</p>
              <p className="mt-1.5 text-[13px] text-muted">{item.label}</p>
            </div>
          ))}
          <div className="col-span-2 flex items-center justify-center border-t border-line px-4 py-4 md:col-span-1 md:justify-end md:border-l md:border-t-0 md:py-0 md:pl-5 lg:pl-6">
            <Image
              src={RAY_WHITE_ELITE_BADGE.image}
              alt={RAY_WHITE_ELITE_BADGE.alt}
              width={200}
              height={124}
              className="h-auto w-full max-w-[8.5rem] object-contain md:max-w-[9.5rem]"
              priority
            />
          </div>
        </div>
      </section>

      <section className="section-tight border-b border-line bg-paper">
        <div className="shell">
          <RmaBadgeStrip />
        </div>
      </section>

      <section className="section overflow-hidden bg-paper">
        <div data-reveal className="shell mb-8 md:mb-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Client reviews</p>
              <h2 className="display mt-2 text-4xl md:text-5xl">
                Reviews that carry weight
              </h2>
              <p className="mt-3 max-w-2xl text-ink-soft">
                Hear from North Shore sellers and buyers who’ve worked with Drew
                — clear advice, strong negotiation, and results that stick.
              </p>
            </div>
            <a
              href={settings?.rateMyAgentUrl || RATE_MY_AGENT_URL}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Read more reviews
            </a>
          </div>
        </div>

        <HorizontalSlider
          label="Client reviews"
          slideClassName="w-[min(88vw,28rem)] md:w-[min(48vw,32rem)]"
        >
          {FEATURED_REVIEWS.map((review) => (
            <figure
              key={review.name}
              className="flex h-full min-h-[280px] flex-col bg-mist p-7 md:min-h-[300px] md:p-9"
            >
              <div
                className="mb-5 text-[13px] tracking-[0.18em] text-rw-yellow"
                aria-label="5 star review"
              >
                ★★★★★
              </div>
              <blockquote className="text-[15px] leading-relaxed text-ink md:text-base">
                “{review.quote}”
              </blockquote>
              <figcaption className="mt-auto pt-8">
                <p className="font-medium">{review.name}</p>
                <p className="mt-0.5 text-sm text-muted">{review.property}</p>
              </figcaption>
            </figure>
          ))}
        </HorizontalSlider>
      </section>

      {currentListings.length > 0 && (
        <section className="section overflow-hidden bg-paper">
          <div className="shell mb-8 md:mb-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">For sale now</p>
                <h2 className="display mt-2 text-4xl md:text-5xl">
                  Current listings
                </h2>
                <p className="mt-3 max-w-xl text-ink-soft">
                  Properties across Drew’s full team — each with a clear lead
                  agent.
                </p>
              </div>
              <Link href="/listings" className="btn btn-primary">
                View all current listings
              </Link>
            </div>
          </div>

          <HorizontalSlider
            label="Current listings"
            slideClassName="w-[min(82vw,22rem)] md:w-[min(38vw,26rem)]"
          >
            {currentListings.map((listing) => (
              <ListingCard
                key={listing.id}
                slug={listing.slug}
                title={listing.title}
                address={listing.address}
                suburb={listing.suburb}
                coverImageUrl={listing.coverImageUrl}
                bedrooms={listing.bedrooms}
                bathrooms={listing.bathrooms}
                status={listing.status}
                priceLabel={listing.listedPriceLabel}
                agents={agentsForCard(listing)}
              />
            ))}
          </HorizontalSlider>
        </section>
      )}

      {team.length > 0 && (
        <section className="section bg-mist">
          <div className="shell">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Under Drew’s umbrella</p>
                <h2 className="display mt-2 text-4xl md:text-5xl">The team</h2>
                <p className="mt-3 max-w-2xl text-ink-soft">
                  A focused group of Ray White Mairangi Bay agents working with
                  Drew — so every client gets specialist attention and a proven
                  process.
                </p>
              </div>
              <Link href="/team" className="btn btn-secondary">
                Meet the team
              </Link>
            </div>
            <TeamGrid members={team} compact />
          </div>
        </section>
      )}

      <SalesMapPromo pinCount={mappedSales} />

      <section className="section overflow-hidden bg-paper">
        <div className="shell mb-8 md:mb-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Track record</p>
              <h2 className="display mt-2 text-4xl md:text-5xl">
                Sold on the North Shore
              </h2>
              <p className="mt-3 text-ink-soft">
                {listingCount} sold properties across the Shore.
              </p>
            </div>
            <Link href="/sold" className="btn btn-secondary">
              View all sold
            </Link>
          </div>
        </div>

        <HorizontalSlider
          label="Sold properties"
          slideClassName="w-[min(82vw,22rem)] md:w-[min(38vw,26rem)]"
        >
          {featured.map((listing) => (
            <ListingCard
              key={listing.id}
              slug={listing.slug}
              title={listing.title}
              address={listing.address}
              suburb={listing.suburb}
              coverImageUrl={listing.coverImageUrl}
              soldPriceCents={listing.soldPriceCents}
              soldDate={listing.soldDate}
              bedrooms={listing.bedrooms}
              bathrooms={listing.bathrooms}
              agents={agentsForCard(listing)}
            />
          ))}
        </HorizontalSlider>
      </section>

      <section className="section bg-mist">
        <div className="shell max-w-2xl text-center md:mx-auto md:text-center">
          <p className="eyebrow">Work with an Elite agent</p>
          <h2 className="display mt-2 text-4xl md:text-5xl">
            Straight shooter. Local to the bone. Results first.
          </h2>
          <p className="prose-site mx-auto mt-4">
            Having spent his life on Auckland’s North Shore, Drew brings genuine
            community knowledge — and the negotiation experience of hundreds of
            real transactions.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/about" className="btn btn-primary">
              About Drew
            </Link>
            <Link href="/appraisal" className="btn btn-secondary">
              Get an appraisal
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
