import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const listingCardInclude = {
  leadAgent: {
    select: { slug: true, name: true, photoUrl: true, isLead: true },
  },
  agentLinks: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      agent: {
        select: { slug: true, name: true, photoUrl: true, isLead: true },
      },
    },
  },
} satisfies Prisma.ListingInclude;

type ListingWithAgents = Prisma.ListingGetPayload<{
  include: typeof listingCardInclude;
}>;

/** @deprecated use listingCardInclude */
export const listingCardAgentInclude = listingCardInclude;

export function agentsForCard(listing: ListingWithAgents) {
  if (listing.agentLinks.length > 0) {
    return listing.agentLinks.map((link) => ({
      slug: link.agent.slug,
      name: link.agent.name,
      photoUrl: link.agent.photoUrl,
      isLead: link.isLead,
    }));
  }
  if (listing.leadAgent) {
    return [
      {
        slug: listing.leadAgent.slug,
        name: listing.leadAgent.name,
        photoUrl: listing.leadAgent.photoUrl,
        isLead: listing.leadAgent.isLead,
      },
    ];
  }
  return [];
}

/** Drew’s listings first, then newest list date. */
export function sortTeamListings<T extends ListingWithAgents>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aDrew = a.leadAgent?.isLead ? 1 : 0;
    const bDrew = b.leadAgent?.isLead ? 1 : 0;
    if (aDrew !== bDrew) return bDrew - aDrew;

    const aDate = a.listedAt?.getTime() ?? a.createdAt.getTime();
    const bDate = b.listedAt?.getTime() ?? b.createdAt.getTime();
    return bDate - aDate;
  });
}

export async function getCurrentTeamListings(take?: number) {
  const rows = await prisma.listing.findMany({
    where: {
      published: true,
      status: { in: ["FOR_SALE", "UNDER_OFFER", "COMING_SOON"] },
    },
    include: listingCardInclude,
  });
  const sorted = sortTeamListings(rows);
  return take != null ? sorted.slice(0, take) : sorted;
}

export async function getAgentListings(agentId: string) {
  const links = await prisma.listingAgent.findMany({
    where: {
      agentId,
      listing: {
        published: true,
      },
    },
    include: {
      listing: {
        include: listingCardInclude,
      },
    },
  });

  const listings = links.map((link) => link.listing);
  const byListedAt = (a: ListingWithAgents, b: ListingWithAgents) => {
    const aDate = a.listedAt?.getTime() ?? a.createdAt.getTime();
    const bDate = b.listedAt?.getTime() ?? b.createdAt.getTime();
    return bDate - aDate;
  };

  const current = listings
    .filter((l) =>
      ["FOR_SALE", "UNDER_OFFER", "COMING_SOON"].includes(l.status)
    )
    .sort(byListedAt);

  const sold = listings
    .filter((l) => l.status === "SOLD")
    .sort((a, b) => {
      const aDate =
        a.soldDate?.getTime() ?? a.listedAt?.getTime() ?? a.updatedAt.getTime();
      const bDate =
        b.soldDate?.getTime() ?? b.listedAt?.getTime() ?? b.updatedAt.getTime();
      return bDate - aDate;
    });

  return { current, sold };
}
