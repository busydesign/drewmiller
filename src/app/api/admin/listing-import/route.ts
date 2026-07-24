import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchListingPreview } from "@/lib/listing-import/fetch-listing-preview";
import { geocodePropertyAddress } from "@/lib/geocode";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function suburbFromAddress(address: string): string | null {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    // e.g. "504 Beach Road, Murrays Bay, North Shore City"
    return parts[1] || null;
  }
  return null;
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const url = String(body.url || "").trim();
  const mode = body.mode === "publish" ? "publish" : "preview";
  const listingId =
    typeof body.listingId === "string" && body.listingId.trim()
      ? body.listingId.trim()
      : null;
  const agentIdsOverride: string[] | null = Array.isArray(body.agentIds)
    ? body.agentIds
        .map((id: unknown) => String(id || "").trim())
        .filter((id: string): id is string => Boolean(id))
    : null;

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    // Ensure Ray White TLS quirks don't block server-side fetch in local/dev
    if (process.env.NODE_ENV !== "production") {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    const preview = await fetchListingPreview(url);
    if (mode === "preview") {
      return NextResponse.json({ preview });
    }

    const address = preview.propertyAddress || preview.title;
    const isForSale = preview.status !== "SOLD";
    const externalId = preview.hints.externalId?.trim() || null;

    // Prefer explicit listing target (admin "refresh this page"), else match
    // sourceUrl / externalId (team sync often creates the row first).
    const existing =
      (listingId
        ? await prisma.listing.findUnique({ where: { id: listingId } })
        : null) ||
      (await prisma.listing.findFirst({
        where: { sourceUrl: preview.sourceUrl },
      })) ||
      (externalId
        ? await prisma.listing.findUnique({ where: { externalId } })
        : null) ||
      (externalId
        ? await prisma.listing.findFirst({
            where: { sourceUrl: { contains: externalId } },
          })
        : null);

    if (listingId && !existing) {
      return NextResponse.json(
        { error: "Target listing not found" },
        { status: 404 }
      );
    }

    let slug = existing?.slug;
    if (!slug) {
      let baseSlug = slugify(address);
      if (isForSale && !baseSlug.startsWith("for-sale-")) {
        baseSlug = `for-sale-${baseSlug}`;
      }
      slug = baseSlug;
      let i = 2;
      while (await prisma.listing.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${i++}`;
      }
    }

    const geo =
      preview.latitude != null && preview.longitude != null
        ? {
            latitude: preview.latitude,
            longitude: preview.longitude,
          }
        : await geocodePropertyAddress(address);

    const suburb = suburbFromAddress(address);
    const listedPriceLabel =
      preview.listedPriceLabel || preview.hints.listedPriceLabel || null;
    const building = preview.buildingArea || preview.hints.buildingArea || null;
    const land = preview.landArea || preview.hints.landArea || null;
    const summary =
      preview.summary ||
      [
        preview.title !== address ? preview.title : null,
        listedPriceLabel,
        building ? `Building ${building}` : null,
        land ? `Land ${land}` : null,
      ]
        .filter(Boolean)
        .join(" · ") ||
      preview.description;

    const teamAgents = await prisma.agent.findMany({
      where: { published: true },
      select: { id: true, name: true, rwMemberId: true, isLead: true },
      orderBy: [{ isLead: "desc" }, { sortOrder: "asc" }],
    });
    const byMemberId = new Map(
      teamAgents
        .filter((a) => a.rwMemberId != null)
        .map((a) => [a.rwMemberId as number, a])
    );
    const byName = new Map(
      teamAgents.map((a) => [a.name.toLowerCase(), a] as const)
    );

    const sourceAgents =
      preview.hints.agents?.length
        ? preview.hints.agents
        : preview.hints.agentName || preview.hints.agentMemberId != null
          ? [
              {
                fullName: preview.hints.agentName || "",
                memberId: preview.hints.agentMemberId ?? null,
              },
            ]
          : [];

    let matchedAgents = sourceAgents
      .map((row, index) => {
        const agent =
          (row.memberId != null ? byMemberId.get(row.memberId) : null) ||
          (row.fullName
            ? byName.get(row.fullName.toLowerCase()) || null
            : null);
        if (!agent) return null;
        return { agent, index, isLead: index === 0 };
      })
      .filter(
        (
          row
        ): row is {
          agent: (typeof teamAgents)[number];
          index: number;
          isLead: boolean;
        } => Boolean(row)
      );

    // Manual override from admin checkboxes (order preserved; first = lead)
    if (agentIdsOverride?.length) {
      matchedAgents = agentIdsOverride
        .map((id, index) => {
          const agent = teamAgents.find((a) => a.id === id);
          if (!agent) return null;
          return { agent, index, isLead: index === 0 };
        })
        .filter(
          (
            row
          ): row is {
            agent: (typeof teamAgents)[number];
            index: number;
            isLead: boolean;
          } => Boolean(row)
        );
    }

    const leadAgent = matchedAgents.find((a) => a.isLead)?.agent || null;

    const listingData = {
      slug,
      title: address,
      address,
      suburb,
      status: (preview.status === "SOLD" ? "SOLD" : "FOR_SALE") as
        | "SOLD"
        | "FOR_SALE",
      summary,
      bodyMarkdown: preview.bodyMarkdown || preview.description,
      bodyHtml: preview.bodyHtml || null,
      coverImageUrl: preview.galleryUrls[0] || null,
      bedrooms: preview.hints.bedrooms ?? null,
      bathrooms: preview.hints.bathrooms ?? null,
      parking: preview.hints.parking ?? null,
      propertyType: preview.propertyType || preview.hints.propertyType || null,
      listedPriceLabel,
      listedAt: existing?.listedAt ?? new Date(),
      sourceUrl: preview.sourceUrl,
      importSource: preview.source,
      externalId: externalId || existing?.externalId || null,
      leadAgentId: leadAgent?.id ?? null,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      seoTitle: `${address} | ${isForSale ? "For sale" : "Sold"} with Drew Miller`,
      seoDescription: (preview.bodyMarkdown || preview.description || "")
        .slice(0, 160)
        .replace(/\s+/g, " "),
      published: true,
      featured: isForSale,
    };

    const listing = existing
      ? await prisma.listing.update({
          where: { id: existing.id },
          data: {
            ...listingData,
            images: {
              deleteMany: {},
              create: preview.galleryUrls.slice(0, 60).map((imageUrl, sortOrder) => ({
                url: imageUrl,
                alt: address,
                sortOrder,
              })),
            },
          },
        })
      : await prisma.listing.create({
          data: {
            ...listingData,
            images: {
              create: preview.galleryUrls.slice(0, 60).map((imageUrl, sortOrder) => ({
                url: imageUrl,
                alt: address,
                sortOrder,
              })),
            },
          },
        });

    await prisma.listingAgent.deleteMany({ where: { listingId: listing.id } });
    if (matchedAgents.length > 0) {
      await prisma.listingAgent.createMany({
        data: matchedAgents.map(({ agent, index, isLead }) => ({
          listingId: listing.id,
          agentId: agent.id,
          isLead,
          sortOrder: index,
        })),
      });
    }

    // Only mirror sold imports into the sales/comps table
    if (preview.status === "SOLD" && !existing) {
      await prisma.sale.create({
        data: {
          address: listing.address,
          suburb: listing.suburb,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          latitude: listing.latitude,
          longitude: listing.longitude,
          sourceUrl: listing.sourceUrl,
          listingId: listing.id,
          notes: `Imported from ${preview.source}`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      slug: listing.slug,
      id: listing.id,
      source: preview.source,
      images: preview.galleryUrls.length,
      updated: Boolean(existing),
      agents: matchedAgents.map(({ agent, isLead }) => ({
        id: agent.id,
        name: agent.name,
        isLead,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 400 }
    );
  }
}
