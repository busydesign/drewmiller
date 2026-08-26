import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseAdminListingStatus } from "@/lib/listing-status";
import { fromNzDateTimeLocal } from "@/lib/open-homes";

type Params = { params: Promise<{ id: string }> };

function parseManualOpenHomes(value: unknown) {
  if (!Array.isArray(value)) return null;
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const startsRaw = String(
        (row as { startsAt?: unknown }).startsAt || ""
      ).trim();
      const endsRaw = String((row as { endsAt?: unknown }).endsAt || "").trim();
      const startsAt = fromNzDateTimeLocal(startsRaw);
      const endsAt = fromNzDateTimeLocal(endsRaw);
      if (!startsAt || !endsAt || endsAt.getTime() <= startsAt.getTime()) {
        return null;
      }
      return { startsAt, endsAt };
    })
    .filter(
      (row): row is { startsAt: Date; endsAt: Date } => Boolean(row)
    );
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Listing id required" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, slug: true, address: true, title: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const hasAgents = Array.isArray(body.agentIds);
  const status = parseAdminListingStatus(body.status);
  const hasOpenHomes = Array.isArray(body.openHomesManual);
  const manualHomes = hasOpenHomes
    ? parseManualOpenHomes(body.openHomesManual)
    : null;

  if (!hasAgents && !status && !hasOpenHomes) {
    return NextResponse.json(
      { error: "agentIds, status, or openHomesManual is required" },
      { status: 400 }
    );
  }

  if (hasOpenHomes && manualHomes == null) {
    return NextResponse.json(
      { error: "Each extra open home needs a start and finish time." },
      { status: 400 }
    );
  }

  let agents: { id: string; name: string; isLead: boolean }[] | undefined;

  if (hasAgents) {
    const agentIds: string[] = body.agentIds
      .map((value: unknown) => String(value || "").trim())
      .filter((id: string): id is string => Boolean(id));

    const found =
      agentIds.length > 0
        ? await prisma.agent.findMany({
            where: { id: { in: agentIds }, published: true },
            select: { id: true, name: true },
          })
        : [];
    const byId = new Map(found.map((a) => [a.id, a]));
    const ordered = agentIds
      .map((agentId) => byId.get(agentId))
      .filter((a): a is { id: string; name: string } => Boolean(a));

    await prisma.listingAgent.deleteMany({ where: { listingId: listing.id } });
    if (ordered.length > 0) {
      await prisma.listingAgent.createMany({
        data: ordered.map((agent, index) => ({
          listingId: listing.id,
          agentId: agent.id,
          isLead: index === 0,
          sortOrder: index,
        })),
      });
    }

    agents = ordered.map((agent, index) => ({
      id: agent.id,
      name: agent.name,
      isLead: index === 0,
    }));

    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        leadAgentId: ordered[0]?.id ?? null,
        ...(status
          ? {
              status,
              featured: status === "FOR_SALE",
              seoTitle: `${listing.address || listing.title} | ${
                status === "SOLD"
                  ? "Sold"
                  : status === "WITHDRAWN"
                    ? "Withdrawn"
                    : "For sale"
              } with Drew Miller`,
            }
          : {}),
      },
    });
  } else if (status) {
    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        status,
        featured: status === "FOR_SALE",
        seoTitle: `${listing.address || listing.title} | ${
          status === "SOLD"
            ? "Sold"
            : status === "WITHDRAWN"
              ? "Withdrawn"
              : "For sale"
        } with Drew Miller`,
      },
    });
  }

  if (manualHomes) {
    await prisma.listingOpenHome.deleteMany({
      where: { listingId: listing.id, source: "MANUAL" },
    });
    if (manualHomes.length > 0) {
      await prisma.listingOpenHome.createMany({
        data: manualHomes.map((home) => ({
          listingId: listing.id,
          startsAt: home.startsAt,
          endsAt: home.endsAt,
          source: "MANUAL" as const,
        })),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    id: listing.id,
    slug: listing.slug,
    status: status || undefined,
    agents,
    openHomesManual: manualHomes?.length ?? undefined,
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Listing id required" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  await prisma.listing.delete({ where: { id: listing.id } });

  return NextResponse.json({ ok: true, slug: listing.slug });
}
