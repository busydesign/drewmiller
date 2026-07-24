import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    select: { id: true, slug: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.agentIds)) {
    return NextResponse.json(
      { error: "agentIds array is required" },
      { status: 400 }
    );
  }

  const agentIds = body.agentIds
    .map((value: unknown) => String(value || "").trim())
    .filter(Boolean);

  const agents =
    agentIds.length > 0
      ? await prisma.agent.findMany({
          where: { id: { in: agentIds }, published: true },
          select: { id: true, name: true },
        })
      : [];
  const byId = new Map(agents.map((a) => [a.id, a]));
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

  await prisma.listing.update({
    where: { id: listing.id },
    data: { leadAgentId: ordered[0]?.id ?? null },
  });

  return NextResponse.json({
    ok: true,
    id: listing.id,
    slug: listing.slug,
    agents: ordered.map((agent, index) => ({
      id: agent.id,
      name: agent.name,
      isLead: index === 0,
    })),
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
    select: { id: true, slug: true, address: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Sale.listingId is not a Prisma FK — clear linked comps first
  await prisma.sale.deleteMany({ where: { listingId: listing.id } });
  await prisma.listing.delete({ where: { id: listing.id } });

  return NextResponse.json({
    ok: true,
    id: listing.id,
    slug: listing.slug,
    address: listing.address,
  });
}
