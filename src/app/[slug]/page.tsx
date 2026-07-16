import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentAvatar } from "@/components/AgentAvatar";
import { ListingFeatures } from "@/components/ListingFeatures";
import { ListingGallery } from "@/components/ListingGallery";
import { ListingLocationMap } from "@/components/ListingLocationMap";
import { prisma } from "@/lib/db";
import { formatDate, formatPriceCents } from "@/lib/format";
import {
  cleanMigratedBodyHtml,
  stripImportFooter,
} from "@/lib/clean-migrated-html";
import {
  isJunkMigrationImage,
  pickCoverImage,
} from "@/lib/listing-images";

type Props = { params: Promise<{ slug: string }> };

const RESERVED = new Set([
  "sold",
  "listings",
  "map",
  "appraisal",
  "about",
  "contact",
  "admin",
  "api",
  "blog",
  "login",
  "team",
]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await prisma.listing.findUnique({ where: { slug } });
  if (listing) {
    return {
      title: listing.seoTitle || listing.title,
      description: listing.seoDescription || listing.summary || undefined,
      alternates: { canonical: `/${listing.slug}` },
    };
  }
  const page = await prisma.contentPage.findUnique({ where: { slug } });
  if (page) {
    return {
      title: page.seoTitle || page.title,
      description: page.seoDescription || page.summary || undefined,
    };
  }
  return {};
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  if (RESERVED.has(slug)) notFound();

  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      leadAgent: true,
      agentLinks: {
        orderBy: { sortOrder: "asc" },
        include: { agent: true },
      },
    },
  });

  if (listing) {
    const isForSale =
      listing.status === "FOR_SALE" ||
      listing.status === "UNDER_OFFER" ||
      listing.status === "COMING_SOON";
    const price = formatPriceCents(listing.soldPriceCents);
    const date = formatDate(listing.soldDate);
    const cleanedSummary = stripImportFooter(listing.summary);
    const headline = isForSale
      ? cleanedSummary
          ?.split(" · ")
          .map((part) => part.trim())
          .find(
            (part) =>
              part &&
              !/^Imported from\b/i.test(part) &&
              !/^https?:\/\//i.test(part)
          ) || null
      : null;
    const specBits =
      cleanedSummary
        ?.split(" · ")
        .filter((part) => /^(Building|Land)\b/i.test(part)) || [];
    const listingAgents =
      listing.agentLinks.length > 0
        ? listing.agentLinks.map((link) => link.agent)
        : listing.leadAgent
          ? [listing.leadAgent]
          : [];
    const agent = listingAgents[0] || listing.leadAgent;
    const agentPhone = agent?.phone?.replace(/\s+/g, "") || "021963654";
    const agentPhoneLabel = agent?.phone || "021 963 654";
    const coverImageUrl = pickCoverImage(
      listing.coverImageUrl,
      listing.images.map((image) => image.url)
    );
    const galleryImages = listing.images.filter(
      (image) => !isJunkMigrationImage(image.url)
    );
    const bodyHtml = cleanMigratedBodyHtml(listing.bodyHtml);
    const bodyMarkdown = stripImportFooter(listing.bodyMarkdown);

    return (
      <article>
        <section className="relative min-h-[48vh] overflow-hidden bg-ink text-white">
          {coverImageUrl && (
            <Image
              src={coverImageUrl}
              alt={listing.title}
              fill
              className="object-cover"
              unoptimized
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-ink/15" />
          <div className="shell relative flex min-h-[48vh] items-end py-12">
            <div>
              <p className="eyebrow !text-white/65">
                {isForSale ? "Current listing" : "Sold property"}
              </p>
              <h1 className="display mt-3 max-w-4xl text-4xl md:text-6xl">
                {listing.address}
              </h1>
              {headline && (
                <p className="mt-3 max-w-3xl text-lg text-white/90 md:text-xl">
                  {headline}
                </p>
              )}
              <p className="mt-3 text-white/75">
                {[listing.suburb, listing.city].filter(Boolean).join(", ")}
              </p>
              <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium">
                {isForSale && listing.listedPriceLabel && (
                  <span className="rounded-full bg-rw-yellow px-3 py-1.5 text-ink">
                    {listing.listedPriceLabel}
                  </span>
                )}
                {!isForSale && price && <span>{price}</span>}
                {!isForSale && date && <span>Sold {date}</span>}
                {listing.bedrooms != null && listing.bedrooms > 0 && (
                  <span>{listing.bedrooms} bed</span>
                )}
                {listing.bathrooms != null && listing.bathrooms > 0 && (
                  <span>{listing.bathrooms} bath</span>
                )}
                {listing.parking != null && listing.parking > 0 && (
                  <span>{listing.parking} park</span>
                )}
                {specBits.map((bit) => (
                  <span key={bit}>{bit}</span>
                ))}
              </div>
              {listingAgents.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  {listingAgents.map((person, index) => (
                    <Link
                      key={person.id}
                      href={`/team/${person.slug}`}
                      className="inline-flex items-center gap-3 text-white"
                    >
                      <AgentAvatar
                        name={person.name}
                        photoUrl={person.photoUrl}
                        size="md"
                        link={false}
                      />
                      <span>
                        <span className="block text-sm font-bold">
                          {person.name}
                        </span>
                        <span className="text-xs text-white/70">
                          {index === 0 ? "Lead agent" : "Co-agent"}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="pb-[clamp(3.5rem,7vw,6rem)] pt-8 md:pt-10">
          <div className="shell grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="min-w-0 space-y-8">
              {bodyHtml ? (
                <div
                  className="prose-site mt-0 max-w-none space-y-4"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              ) : bodyMarkdown ? (
                <div className="prose-site mt-0 whitespace-pre-wrap">
                  {bodyMarkdown}
                </div>
              ) : null}

              {listing.latitude != null && listing.longitude != null && (
                <ListingLocationMap
                  address={listing.address}
                  latitude={listing.latitude}
                  longitude={listing.longitude}
                />
              )}

              {galleryImages.length > 0 && (
                <ListingGallery
                  images={galleryImages.map((image) => ({
                    id: image.id,
                    url: image.url,
                    alt: image.alt || listing.address,
                  }))}
                />
              )}
            </div>

            <aside className="h-fit border border-line bg-paper p-6 lg:sticky lg:top-24 lg:self-start">
              {isForSale ? (
                <>
                  <p className="eyebrow">Inspect / enquire</p>
                  <h2 className="display mt-2 text-3xl">Interested in this property?</h2>
                  <p className="mt-3 text-sm text-ink-soft">
                    Arrange a viewing with{" "}
                    {agent?.name || "Drew"}
                    {agent && !agent.isLead ? " from Drew’s team" : ""}
                    , or open the full Ray White listing for open homes and
                    enquiry forms.
                  </p>
                  {listingAgents.length > 0 && (
                    <div className="mt-5 space-y-3 border-b border-line pb-4">
                      {listingAgents.map((person, index) => (
                        <div key={person.id} className="flex items-center gap-3">
                          <AgentAvatar
                            name={person.name}
                            slug={person.slug}
                            photoUrl={person.photoUrl}
                            size={index === 0 ? "lg" : "md"}
                            showName
                          />
                          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                            {index === 0 ? "Lead" : "Co-agent"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <ListingFeatures
                    features={[
                      ...(listing.listedPriceLabel
                        ? [
                            {
                              label: "Price",
                              value: listing.listedPriceLabel,
                            },
                          ]
                        : []),
                      ...(listing.propertyType
                        ? [{ label: "Type", value: listing.propertyType }]
                        : []),
                      ...(listing.bedrooms != null && listing.bedrooms > 0
                        ? [{ label: "Bedrooms", value: listing.bedrooms }]
                        : []),
                      ...(listing.bathrooms != null && listing.bathrooms > 0
                        ? [{ label: "Bathrooms", value: listing.bathrooms }]
                        : []),
                      ...(listing.parking != null && listing.parking > 0
                        ? [{ label: "Parking", value: listing.parking }]
                        : []),
                      ...specBits.map((bit) => {
                        const [label, ...rest] = bit.split(" ");
                        return {
                          label: label || "Detail",
                          value: rest.join(" "),
                        };
                      }),
                    ]}
                  />
                  {listing.sourceUrl && (
                    <a
                      href={listing.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary mt-6 w-full"
                    >
                      View on Ray White
                    </a>
                  )}
                  <a
                    href={`tel:${agentPhone}`}
                    className="btn btn-secondary mt-3 w-full"
                  >
                    Call {agentPhoneLabel}
                  </a>
                </>
              ) : (
                <>
                  <p className="eyebrow">Next step</p>
                  <h2 className="display mt-2 text-3xl">Thinking of selling nearby?</h2>
                  <p className="mt-3 text-sm text-ink-soft">
                    Get a clear appraisal and see recent sales around your address.
                  </p>
                  <Link href="/appraisal" className="btn btn-primary mt-6 w-full">
                    Request appraisal
                  </Link>
                  <Link href="/map" className="btn btn-secondary mt-3 w-full">
                    Open sales map
                  </Link>
                </>
              )}
            </aside>
          </div>
        </section>
      </article>
    );
  }

  const page = await prisma.contentPage.findUnique({ where: { slug } });
  if (!page || !page.published) notFound();
  const pageHtml = cleanMigratedBodyHtml(page.bodyHtml);

  return (
    <section className="section">
      <div className="shell max-w-3xl">
        <p className="eyebrow">{page.kind.toLowerCase()}</p>
        <h1 className="display mt-2 text-5xl">{page.title}</h1>
        {page.summary && <p className="mt-4 text-lg text-ink-soft">{page.summary}</p>}
        {pageHtml ? (
          <div
            className="prose-site mt-10 space-y-4"
            dangerouslySetInnerHTML={{ __html: pageHtml }}
          />
        ) : (
          <div className="prose-site mt-10 whitespace-pre-wrap">
            {page.bodyMarkdown}
          </div>
        )}
      </div>
    </section>
  );
}
