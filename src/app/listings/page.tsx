import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { prisma } from "@/lib/db";
import {
  agentsForCard,
  getCurrentTeamListings,
} from "@/lib/listings-query";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Current listings",
  description:
    "Browse current North Shore properties for sale with Drew Miller and his Ray White Mairangi Bay team.",
};

export default async function CurrentListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string }>;
}) {
  const { agent: agentSlug } = await searchParams;
  const [listings, team] = await Promise.all([
    getCurrentTeamListings(),
    prisma.agent.findMany({
      where: { published: true },
      orderBy: [{ isLead: "desc" }, { sortOrder: "asc" }],
      select: { slug: true, name: true },
    }),
  ]);

  const filtered = agentSlug
    ? listings.filter((listing) =>
        listing.agentLinks.some((link) => link.agent.slug === agentSlug)
      )
    : listings;

  const activeAgent = team.find((a) => a.slug === agentSlug);

  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow">For sale now · {filtered.length} properties</p>
        <h1 className="display mt-2 text-5xl md:text-6xl">Current listings</h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          Every current listing from Drew Miller’s team — Drew first, then by
          newest list date. Cards show everyone marketing the property.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/listings"
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
              !agentSlug
                ? "bg-rw-yellow text-ink shadow-sm"
                : "border border-line bg-paper/80 text-ink-soft hover:border-ink/30 hover:text-ink"
            }`}
          >
            All team
          </Link>
          {team.map((member) => (
            <Link
              key={member.slug}
              href={`/listings?agent=${member.slug}`}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                agentSlug === member.slug
                  ? "bg-rw-yellow text-ink shadow-sm"
                  : "border border-line bg-paper/80 text-ink-soft hover:border-ink/30 hover:text-ink"
              }`}
            >
              {member.name.split(" ")[0]}
            </Link>
          ))}
        </div>

        {activeAgent && (
          <p className="mt-4 text-sm text-ink-soft">
            Showing listings marketed by {activeAgent.name}.
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="mt-10 border border-line bg-paper p-8">
            <p className="font-bold">No current listings for this filter.</p>
            <Link href="/listings" className="btn btn-primary mt-4 inline-flex">
              View all team listings
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => (
              <ListingCard
                key={listing.id}
                slug={listing.slug}
                title={listing.title}
                address={listing.address}
                suburb={listing.suburb}
                coverImageUrl={listing.coverImageUrl}
                soldPriceCents={null}
                soldDate={null}
                bedrooms={listing.bedrooms}
                bathrooms={listing.bathrooms}
                status={listing.status}
                priceLabel={listing.listedPriceLabel}
                agents={agentsForCard(listing)}
              />
            ))}
          </div>
        )}

        <div className="mt-12 flex flex-wrap gap-3 border-t border-line pt-8">
          <Link href="/team" className="btn btn-primary">
            Meet the team
          </Link>
          <Link href="/sold" className="btn btn-secondary">
            Browse sold properties
          </Link>
        </div>
      </div>
    </section>
  );
}
