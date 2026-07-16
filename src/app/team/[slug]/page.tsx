import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingCard } from "@/components/ListingCard";
import { prisma } from "@/lib/db";
import { agentsForCard, getAgentListings } from "@/lib/listings-query";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const agents = await prisma.agent.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return agents.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agent = await prisma.agent.findUnique({ where: { slug } });
  if (!agent) return {};
  return {
    title: agent.name,
    description:
      agent.bioMarkdown?.slice(0, 160) ||
      `${agent.name} — Ray White Mairangi Bay, part of Drew Miller’s team.`,
  };
}

export default async function TeamMemberPage({ params }: Props) {
  const { slug } = await params;
  const agent = await prisma.agent.findUnique({ where: { slug } });
  if (!agent || !agent.published) notFound();

  const { current, sold } = await getAgentListings(agent.id);
  const firstName = agent.name.split(" ")[0];

  return (
    <article>
      <section className="section border-b border-line bg-paper">
        <div className="shell grid items-start gap-10 lg:grid-cols-[auto_1fr]">
          <div className="relative h-40 w-40 overflow-hidden rounded-full border border-line bg-mist md:h-52 md:w-52">
            {agent.photoUrl ? (
              <Image
                src={agent.photoUrl}
                alt={agent.name}
                fill
                className="object-cover object-top"
                sizes="208px"
                priority
                unoptimized
              />
            ) : null}
          </div>
          <div>
            {agent.isLead && (
              <p className="eyebrow !text-ink">Team lead</p>
            )}
            {!agent.isLead && <p className="eyebrow">Drew Miller team</p>}
            <h1 className="display mt-2 text-5xl md:text-6xl">{agent.name}</h1>
            {agent.role && (
              <p className="mt-3 text-lg text-ink-soft">{agent.role}</p>
            )}
            <p className="mt-4 max-w-xl text-sm text-ink-soft">
              {current.length} current{" "}
              {current.length === 1 ? "listing" : "listings"}
              {sold.length > 0
                ? ` · ${sold.length} sold on this site`
                : ""}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
              {agent.phone && (
                <a
                  href={`tel:${agent.phone.replace(/\s+/g, "")}`}
                  className="btn btn-primary !py-2"
                >
                  {agent.phone}
                </a>
              )}
              {agent.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="btn btn-secondary !py-2"
                >
                  Email
                </a>
              )}
              {agent.sourceUrl && (
                <a
                  href={agent.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary !py-2"
                >
                  Ray White profile
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {(agent.bioHtml || agent.bioMarkdown) && (
        <section className="section">
          <div className="shell max-w-3xl">
            {agent.bioHtml ? (
              <div
                className="prose-site"
                dangerouslySetInnerHTML={{ __html: agent.bioHtml }}
              />
            ) : (
              <div className="prose-site whitespace-pre-wrap">
                {agent.bioMarkdown}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section border-t border-line bg-paper">
        <div className="shell">
          <p className="eyebrow">For sale</p>
          <h2 className="display mt-2 text-4xl">
            Current listings with {firstName}
          </h2>
          {current.length === 0 ? (
            <p className="mt-6 text-ink-soft">
              No current listings linked to {firstName} right now — check back
              soon, or browse the full team list.
            </p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {current.map((listing) => {
                const teamAgents = agentsForCard(listing);
                // Profile agent first on their own page, then co-listers
                const ordered = [
                  {
                    slug: agent.slug,
                    name: agent.name,
                    photoUrl: agent.photoUrl,
                    isLead: listing.leadAgentId === agent.id,
                  },
                  ...teamAgents.filter((a) => a.slug !== agent.slug),
                ];
                return (
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
                    agents={ordered}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {sold.length > 0 && (
        <section className="section border-t border-line">
          <div className="shell">
            <p className="eyebrow">Track record</p>
            <h2 className="display mt-2 text-4xl">Sold with {firstName}</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sold.slice(0, 12).map((listing) => {
                const teamAgents = agentsForCard(listing);
                const ordered = [
                  {
                    slug: agent.slug,
                    name: agent.name,
                    photoUrl: agent.photoUrl,
                    isLead: listing.leadAgentId === agent.id,
                  },
                  ...teamAgents.filter((a) => a.slug !== agent.slug),
                ];
                return (
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
                    agents={ordered}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="section border-t border-line">
        <div className="shell flex flex-wrap gap-3">
          <Link href="/team" className="btn btn-secondary">
            Back to team
          </Link>
          <Link href="/listings" className="btn btn-primary">
            All team listings
          </Link>
        </div>
      </section>
    </article>
  );
}
