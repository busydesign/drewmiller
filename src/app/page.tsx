import Image from "next/image";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { HeroBanner } from "@/components/HeroBanner";
import { HorizontalSlider } from "@/components/HorizontalSlider";
import { ListingCard } from "@/components/ListingCard";
import { SalesMapPromo } from "@/components/SalesMapPromo";
import { TeamGrid } from "@/components/TeamGrid";
import {
  AGENT_STATS,
  FEATURED_REVIEWS,
  DREW_PORTRAIT,
  RATE_MY_AGENT_URL,
  RAY_WHITE_ELITE_BADGE,
  RMA_AWARD_BADGES,
} from "@/lib/agent-proof";
import { prisma } from "@/lib/db";
import { getSalesMapPins } from "@/lib/map-pins";
import {
  agentsForCard,
  getCurrentTeamListings,
} from "@/lib/listings-query";

export default async function HomePage() {
  const [settings, currentListings, team, mapPins, blogPosts] =
    await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
      getCurrentTeamListings(10),
      prisma.agent.findMany({
        where: { published: true },
        orderBy: [{ isLead: "desc" }, { sortOrder: "asc" }],
      }),
      getSalesMapPins(),
      prisma.contentPage.findMany({
        where: { published: true, kind: "BLOG" },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: 3,
        select: {
          slug: true,
          title: true,
          summary: true,
          coverImageUrl: true,
          publishedAt: true,
        },
      }),
    ]);
  const mappedSales = mapPins.sold.length;

  return (
    <>
      {/* 1. Hero + appraisal CTA */}
      <HeroBanner>
        <div className="text-white">
          <p className="eyebrow fade-up !text-white/65">
            Ray White Mairangi Bay &amp; Milford
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
            <Link href="/about" className="btn btn-on-dark">
              About Drew
            </Link>
          </div>
        </div>
      </HeroBanner>

      {/* 2. Personal introduction + team */}
      <section className="section bg-paper">
        <div className="shell">
          <div
            data-reveal
            className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14"
          >
            <div className="relative min-h-[320px] overflow-hidden bg-mist md:min-h-[420px]">
              <Image
                src={DREW_PORTRAIT}
                alt="Drew Miller"
                fill
                className="object-cover object-[center_20%]"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
            </div>
            <div>
              <p className="eyebrow">Meet Drew</p>
              <h2 className="display mt-2 text-4xl md:text-5xl">
                Straight shooter. Local to the bone.
              </h2>
              <p className="prose-site mt-4 max-w-xl">
                Having spent his life on Auckland’s North Shore, Drew brings
                genuine community knowledge — and the negotiation experience of
                hundreds of real transactions. Clear advice, no theatrics, and a
                process built around getting the result that matters.
              </p>
              <p className="mt-4 max-w-xl text-ink-soft">
                Beside him is a focused Ray White Mairangi Bay team — so every
                client gets specialist attention under one proven umbrella.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/about" className="btn btn-primary">
                  About Drew
                </Link>
                <Link href="/team" className="btn btn-secondary">
                  Meet the team
                </Link>
              </div>
            </div>
          </div>

          {team.length > 0 && (
            <div className="mt-16 md:mt-20">
              <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="eyebrow">Under Drew’s umbrella</p>
                  <h2 className="display mt-2 text-3xl md:text-4xl">
                    The team
                  </h2>
                </div>
                <Link href="/team" className="btn btn-secondary">
                  View full team
                </Link>
              </div>
              <TeamGrid members={team} compact />
            </div>
          )}
        </div>
      </section>

      {/* 3. Awards + recognition — equal columns */}
      <section className="section max-md:pb-28 border-y border-line bg-paper">
        <div className="shell">
          <div data-reveal className="max-w-2xl">
            <p className="eyebrow">Recognition</p>
            <h2 className="display mt-2 text-4xl md:text-5xl">
              Awards and professional standing
            </h2>
            <p className="mt-3 text-ink-soft">
              Ray White Elite performance and RateMyAgent recognition — backed
              by a clear North Shore track record.
            </p>
          </div>

          <div
            data-reveal
            className="mt-10 grid gap-5 md:grid-cols-2 md:items-stretch md:gap-8"
          >
            {/* Left — Ray White */}
            <div className="flex h-full flex-col border border-line bg-white p-5 shadow-[0_4px_24px_rgb(0_0_0_/0.06)] sm:p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-medium tracking-tight md:text-2xl">
                    Elite · {RAY_WHITE_ELITE_BADGE.period}
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">
                    Among Ray White’s top performers for results and
                    consistency.
                  </p>
                </div>
                <Image
                  src={RAY_WHITE_ELITE_BADGE.image}
                  alt={RAY_WHITE_ELITE_BADGE.alt}
                  width={220}
                  height={136}
                  className="h-16 w-auto shrink-0 object-contain sm:h-20 md:h-24"
                />
              </div>

              <dl className="mt-6 grid grid-cols-3 gap-3 md:mt-8 md:gap-4">
                {[
                  {
                    label: "Successful sales",
                    value: AGENT_STATS.salesCountLabel,
                  },
                  {
                    label: "Sales volume",
                    value: AGENT_STATS.salesVolumeLabel,
                  },
                  {
                    label: "Experience",
                    value: AGENT_STATS.experienceLabel,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-[10px] leading-snug text-muted sm:text-[11px]">
                      {item.label}
                    </dt>
                    <dd className="display mt-1 text-xl leading-none sm:text-2xl md:text-3xl">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Right — RateMyAgent */}
            <div className="flex h-full flex-col border border-line bg-white p-5 shadow-[0_4px_24px_rgb(0_0_0_/0.06)] sm:p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-medium tracking-tight md:text-2xl">
                    Independent awards
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">
                    National and local recognition from verified client
                    feedback.
                  </p>
                </div>
                <Image
                  src="/brand/rma/logo-stacked.svg"
                  alt="RateMyAgent"
                  width={140}
                  height={80}
                  className="h-9 w-auto shrink-0 object-contain sm:h-10 md:h-12"
                />
              </div>

              {/* Mobile: scrollable badges. Desktop: balanced 5-up grid. */}
              <ul className="-mx-5 mt-6 flex gap-4 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden md:mx-0 md:mt-8 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:px-0 md:pb-0">
                {RMA_AWARD_BADGES.map((badge) => (
                  <li
                    key={badge.id}
                    className="flex w-[4.75rem] shrink-0 snap-start flex-col items-center text-center md:w-auto md:shrink"
                  >
                    <div className="relative mx-auto aspect-square w-full max-w-[4.75rem] md:max-w-[5.5rem]">
                      <Image
                        src={badge.image}
                        alt={badge.title}
                        fill
                        className="object-contain"
                        sizes="76px"
                      />
                    </div>
                    <p className="mt-2 line-clamp-2 text-[11px] font-medium leading-snug text-ink">
                      {badge.title}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Reviews and testimonials — major trust block */}
      <section className="section overflow-hidden bg-paper">
        <div data-reveal className="shell">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start md:gap-12">
            <div>
              <h2 className="display text-4xl md:text-5xl">
                Trusted by North Shore clients
              </h2>
              <p className="mt-3 max-w-xl text-ink-soft">
                Independent feedback invited after every transaction — positive
                or negative.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <a
                  href={settings?.rateMyAgentUrl || RATE_MY_AGENT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block transition-opacity hover:opacity-80"
                >
                  <Image
                    src="/brand/rma/logo-stacked.svg"
                    alt="RateMyAgent"
                    width={128}
                    height={74}
                    className="h-7 w-auto md:h-8"
                  />
                </a>
                <a
                  href={settings?.rateMyAgentUrl || RATE_MY_AGENT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary !min-h-9 !px-4 !py-1.5 text-[13px]"
                >
                  View all verified reviews
                </a>
              </div>
            </div>

            <div className="flex items-stretch gap-8 sm:gap-10">
              <div className="flex w-[7.75rem] flex-col sm:w-[8.5rem]">
                <p className="display text-5xl leading-none tabular-nums md:text-6xl">
                  {AGENT_STATS.rmaRating}
                </p>
                <p
                  className="mt-2 flex h-5 items-center text-[0.95rem] leading-none tracking-[0.18em] text-rw-yellow"
                  aria-label="5 star average"
                >
                  ★★★★★
                </p>
                <p className="mt-1.5 text-xs text-muted">Overall rating</p>
              </div>
              <div className="w-px shrink-0 self-stretch bg-line" aria-hidden />
              <div className="flex w-[7.75rem] flex-col sm:w-[8.5rem]">
                <p className="display text-5xl leading-none tabular-nums md:text-6xl">
                  {AGENT_STATS.rmaReviewCountLabel}
                </p>
                <div
                  className="mt-2 flex h-5 items-center gap-[0.22em] text-rw-yellow"
                  aria-hidden
                >
                  {Array.from({ length: 5 }).map((_, index) => (
                    <MessageSquare
                      key={index}
                      className="h-[0.95rem] w-[0.95rem] fill-current stroke-[1.5]"
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted">Verified reviews</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 md:mt-12">
          <HorizontalSlider
            label="Client testimonials"
            slideClassName="w-[min(86vw,26rem)] md:w-[min(42vw,28rem)]"
          >
            {FEATURED_REVIEWS.map((review) => (
              <figure
                key={review.name}
                className="flex h-full min-h-[240px] flex-col bg-mist p-6 md:min-h-[260px] md:p-7"
              >
                <div
                  className="mb-4 text-[12px] tracking-[0.18em] text-rw-yellow"
                  aria-label="5 star review"
                >
                  ★★★★★
                </div>
                <blockquote className="text-[15px] leading-relaxed text-ink">
                  “{review.quote}”
                </blockquote>
                <figcaption className="mt-auto pt-6">
                  <p className="text-sm font-medium">{review.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{review.property}</p>
                </figcaption>
              </figure>
            ))}
          </HorizontalSlider>
        </div>
      </section>

      {/* 5. Interactive map of past sales */}
      <SalesMapPromo pinCount={mappedSales} />

      {/* 6. Latest blogs / market updates */}
      <section className="section bg-paper">
        <div className="shell">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Insights</p>
              <h2 className="display mt-2 text-4xl md:text-5xl">
                Market updates
              </h2>
              <p className="mt-3 max-w-2xl text-ink-soft">
                Local North Shore context — what has sold, where activity sits,
                and how that informs your next move.
              </p>
            </div>
          </div>

          {blogPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {blogPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/${post.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-mist">
                    {post.coverImageUrl ? (
                      <Image
                        src={post.coverImageUrl}
                        alt=""
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : null}
                  </div>
                  <p className="mt-4 text-[15px] font-medium leading-snug tracking-tight">
                    {post.title}
                  </p>
                  {post.summary ? (
                    <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
                      {post.summary}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <Link
                href="/map"
                className="block border border-line bg-mist px-6 py-8 transition hover:border-ink/30"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  Sales map
                </p>
                <p className="mt-3 text-lg font-medium tracking-tight">
                  See recent sales near you
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  Explore sold prices and activity across the Shore.
                </p>
              </Link>
              <Link
                href="/sold"
                className="block border border-line bg-mist px-6 py-8 transition hover:border-ink/30"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  Sold archive
                </p>
                <p className="mt-3 text-lg font-medium tracking-tight">
                  Browse the full track record
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  Property pages preserved for proof and local context.
                </p>
              </Link>
              <Link
                href="/appraisal"
                className="block border border-line bg-mist px-6 py-8 transition hover:border-ink/30"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  Local briefing
                </p>
                <p className="mt-3 text-lg font-medium tracking-tight">
                  Ask for a market update
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  Get clear advice on your suburb before you decide.
                </p>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 7. Current listings */}
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

      {/* 8. Closing contact / appraisal CTA */}
      <section className="section bg-paper">
        <div className="shell max-w-2xl text-center md:mx-auto">
          <p className="eyebrow">Next step</p>
          <h2 className="display mt-2 text-4xl md:text-5xl">
            Ready to talk about your property?
          </h2>
          <p className="prose-site mx-auto mt-4">
            Start with an appraisal, or get in touch directly — clear advice,
            local context, and no pressure.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/appraisal" className="btn btn-primary">
              Get an Appraisal
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Contact Drew
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
