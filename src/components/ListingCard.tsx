import Image from "next/image";
import Link from "next/link";
import { AgentAvatar } from "@/components/AgentAvatar";
import { formatDate, formatPriceCents } from "@/lib/format";

export type ListingCardAgent = {
  slug: string;
  name: string;
  photoUrl?: string | null;
  isLead?: boolean;
};

type Props = {
  slug: string;
  title: string;
  address: string;
  suburb?: string | null;
  coverImageUrl?: string | null;
  soldPriceCents?: number | null;
  soldDate?: Date | string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  status?: string | null;
  priceLabel?: string | null;
  /** Single agent (e.g. profile page for that person). */
  agent?: ListingCardAgent | null;
  /** All agents on the listing — stacked thumbs on cards. */
  agents?: ListingCardAgent[] | null;
};

export function ListingCard({
  slug,
  title,
  address,
  suburb,
  coverImageUrl,
  soldPriceCents,
  soldDate,
  bedrooms,
  bathrooms,
  status,
  priceLabel,
  agent,
  agents,
}: Props) {
  const isForSale =
    status === "FOR_SALE" ||
    status === "UNDER_OFFER" ||
    status === "COMING_SOON";
  const price = formatPriceCents(soldPriceCents);
  const date = formatDate(soldDate);
  const badge = isForSale
    ? status === "UNDER_OFFER"
      ? "Under offer"
      : status === "COMING_SOON"
        ? "Coming soon"
        : "For sale"
    : "Sold";

  const displayAgents =
    agents && agents.length > 0 ? agents : agent ? [agent] : [];
  const labelNames = displayAgents.map((a) => a.name.split(" ")[0]).join(" · ");

  return (
    <Link
      href={`/${slug}`}
      className="group block overflow-hidden bg-paper transition-opacity duration-300 hover:opacity-90"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-mist">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-soft">
            Property
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-medium backdrop-blur-md ${
            isForSale
              ? "bg-rw-yellow/95 text-ink"
              : "bg-white/90 text-ink"
          }`}
        >
          {badge}
        </span>
        {displayAgents.length > 0 && (
          <span className="absolute bottom-3 right-3 flex flex-row-reverse items-center">
            {displayAgents
              .slice(0, 3)
              .reverse()
              .map((person, index) => (
                <span
                  key={person.slug}
                  className={index === 0 ? "" : "-mr-2"}
                  style={{ zIndex: index + 1 }}
                >
                  <AgentAvatar
                    name={person.name}
                    slug={person.slug}
                    photoUrl={person.photoUrl}
                    size="md"
                    link={false}
                  />
                </span>
              ))}
          </span>
        )}
      </div>
      <div className="space-y-1.5 pt-4">
        <h3 className="text-[17px] font-medium leading-snug tracking-tight">
          {address}
        </h3>
        <p className="text-sm text-muted">{suburb || "Auckland North Shore"}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {isForSale && priceLabel && (
            <span className="font-medium">{priceLabel}</span>
          )}
          {!isForSale && price && <span className="font-medium">{price}</span>}
          {!isForSale && date && <span className="text-muted">{date}</span>}
          {(bedrooms || bathrooms) && (
            <span className="text-muted">
              {[
                bedrooms ? `${bedrooms} bed` : null,
                bathrooms ? `${bathrooms} bath` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </div>
        {labelNames && (
          <p className="pt-1 text-[12px] text-muted">{labelNames}</p>
        )}
      </div>
    </Link>
  );
}
