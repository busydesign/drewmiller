import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchListingPreview } from "@/lib/listing-import/fetch-listing-preview";
import {
  apiListingMatchesRef,
  listingToPreview,
  rayWhiteApiListingFromUnknown,
} from "@/lib/listing-import/fetch-raywhite-api";
import { extractRayWhiteListingRef } from "@/lib/listing-import/raywhite-source-id";
import {
  applyAdminListingStatus,
  listingAdminSelect,
} from "@/lib/listing-admin-status";
import { geocodePropertyAddress } from "@/lib/geocode";
import { applyListingCampaignTimes } from "@/lib/listing-import/save-open-homes";
import {
  parseAdminListingStatus,
  toAdminListingStatus,
  isCurrentListingStatus,
  type AdminListingStatus,
} from "@/lib/listing-status";
import { revalidateListingPages } from "@/lib/revalidate-listings";
import { slugify } from "@/lib/slugify";

export const maxDuration = 60;

async function findExistingListing(opts: {
  listingId: string | null;
  sourceUrl?: string | null;
  externalId?: string | null;
}) {
  if (opts.listingId) {
    const byId = await prisma.listing.findUnique({
      where: { id: opts.listingId },
      select: listingAdminSelect,
    });
    if (byId) return byId;
  }

  const ref = opts.sourceUrl
    ? extractRayWhiteListingRef(opts.sourceUrl)
    : null;
  const externalId =
    opts.externalId ||
    (ref?.kind === "sourceId" ? ref.value : null) ||
    (ref?.kind === "id" ? `rw:${ref.value}` : null);

  return (
    (opts.sourceUrl
      ? await prisma.listing.findFirst({
          where: { sourceUrl: opts.sourceUrl },
          select: listingAdminSelect,
        })
      : null) ||
    (externalId
      ? await prisma.listing.findUnique({
          where: { externalId },
          select: listingAdminSelect,
        })
      : null) ||
    (ref?.value
      ? await prisma.listing.findFirst({
          where: {
            OR: [
              { sourceUrl: { contains: ref.value } },
              { coverImageUrl: { contains: ref.value } },
              { images: { some: { url: { contains: ref.value } } } },
            ],
          },
          select: listingAdminSelect,
        })
      : null)
  );
}

async function previewFromExistingListing(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        select: { url: true },
      },
      agentLinks: {
        orderBy: { sortOrder: "asc" },
        include: {
          agent: { select: { name: true, rwMemberId: true } },
        },
      },
    },
  });
  if (!listing) return null;
  return {
    source: "raywhite.co.nz" as const,
    sourceUrl: listing.sourceUrl || "",
    title: listing.title,
    propertyAddress: listing.address,
    description: listing.bodyMarkdown,
    bodyHtml: listing.bodyHtml,
    bodyMarkdown: listing.bodyMarkdown,
    summary: listing.summary,
    galleryUrls: listing.images.map((image) => image.url).filter(Boolean),
    listedPriceLabel: listing.listedPriceLabel,
    propertyType: listing.propertyType,
    latitude: listing.latitude,
    longitude: listing.longitude,
    status: listing.status === "SOLD" ? ("SOLD" as const) : ("FOR_SALE" as const),
    hints: {
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      parking: listing.parking,
      externalId: listing.externalId,
      listedPriceLabel: listing.listedPriceLabel,
      agents: listing.agentLinks.map((link) => ({
        fullName: link.agent.name,
        memberId: link.agent.rwMemberId,
      })),
    },
  };
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
  const statusOverride = parseAdminListingStatus(body.status);

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    // Ray White / CloudFront often fail strict TLS from server IPs
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const listingRef = extractRayWhiteListingRef(url);
    const clientListing = rayWhiteApiListingFromUnknown(body.sourceListing);
    if (clientListing && listingRef && !apiListingMatchesRef(clientListing, listingRef)) {
      return NextResponse.json(
        { error: "That Ray White payload does not match the pasted URL." },
        { status: 400 }
      );
    }

    let preview = clientListing
      ? listingToPreview(clientListing, url)
      : null;
    if (!preview) {
      try {
        preview = await fetchListingPreview(url);
      } catch (err) {
        const existing = await findExistingListing({ listingId, sourceUrl: url });
        if (existing) {
          if (mode === "preview") {
            const fromDb = await previewFromExistingListing(existing.id);
            return NextResponse.json({
              preview: fromDb,
              alreadyPublished: true,
              slug: existing.slug,
            });
          }
          const fallbackStatus =
            statusOverride ?? toAdminListingStatus(existing.status);
          if (fallbackStatus === "SOLD" || fallbackStatus === "WITHDRAWN") {
            await applyAdminListingStatus(existing, fallbackStatus);
          }
          return NextResponse.json({
            ok: true,
            slug: existing.slug,
            id: existing.id,
            source: "already-published",
            images: 0,
            updated: true,
            alreadyPublished: true,
            agents: [],
          });
        }
        const blocked =
          err instanceof Error &&
          /403|blocked|cloudfront|could not load that page/i.test(err.message);
        throw blocked
          ? new Error(
              "Ray White blocked this website from reading that page. If the property is already on Current listings, you’re done. If it’s new, try the short office link (rwmairangibay.co.nz/MRG…)."
            )
          : err;
      }
    }
    if (mode === "preview") {
      return NextResponse.json({ preview });
    }

    const address = preview.propertyAddress || preview.title;
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

    const status: AdminListingStatus =
      statusOverride ??
      (existing
        ? toAdminListingStatus(existing.status)
        : preview.status === "SOLD"
          ? "SOLD"
          : "FOR_SALE");
    const isForSale = status === "FOR_SALE";
    const statusLabel =
      status === "SOLD"
        ? "Sold"
        : status === "WITHDRAWN"
          ? "Withdrawn"
          : "For sale";

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

    let geo =
      preview.latitude != null && preview.longitude != null
        ? {
            latitude: preview.latitude,
            longitude: preview.longitude,
          }
        : null;
    if (!geo) {
      try {
        geo = await geocodePropertyAddress(address);
      } catch (err) {
        console.error("Geocode failed; publishing without a map pin", err);
      }
    }

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
        return { agent, index };
      })
      .filter(
        (
          row
        ): row is {
          agent: (typeof teamAgents)[number];
          index: number;
        } => Boolean(row)
      )
      .map((row, index) => ({
        agent: row.agent,
        index,
        isLead: index === 0,
      }));

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
      status,
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
      seoTitle: `${address} | ${statusLabel} with Drew Miller`,
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

    const openHomes = (preview.openHomes || [])
      .map((home) => ({
        startsAt: new Date(home.startsAt),
        endsAt: new Date(home.endsAt),
      }))
      .filter(
        (home) =>
          !Number.isNaN(home.startsAt.getTime()) &&
          !Number.isNaN(home.endsAt.getTime()) &&
          home.endsAt.getTime() > home.startsAt.getTime()
      );
    const auctionAt = preview.auctionAt ? new Date(preview.auctionAt) : null;
    await applyListingCampaignTimes(listing.id, {
      isCurrent: isCurrentListingStatus(status),
      openHomes,
      auction:
        auctionAt && !Number.isNaN(auctionAt.getTime())
          ? {
              auctionAt,
              auctionLocation: preview.auctionLocation || null,
            }
          : null,
    });

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

    revalidateListingPages(listing.slug);

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
