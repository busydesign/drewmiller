import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseAdminListingStatus } from "@/lib/listing-status";

type Params = { params: Promise<{ id: string }> };

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

  if (!hasAgents && !status) {
    return NextResponse.json(
      { error: "agentIds or status is required" },
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

  return NextResponse.json({
    ok: true,
    id: listing.id,
    slug: listing.slug,
    status: status || undefined,
    agents,
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
