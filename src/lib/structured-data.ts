import { AGENT_STATS, RATE_MY_AGENT_URL } from "@/lib/agent-proof";
import { BRAND } from "@/lib/brand";
import { siteUrl } from "@/lib/format";

export function realEstateAgentJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: BRAND.agentName,
    url: siteUrl("/"),
    image: siteUrl("/brand/hero-team.jpg"),
    telephone: BRAND.phoneDisplay,
    email: BRAND.email,
    description:
      "Ray White Elite agent on Auckland’s North Shore — appraisals, sales, and local market advice.",
    areaServed: {
      "@type": "AdministrativeArea",
      name: BRAND.region,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Mairangi Bay",
      addressRegion: "Auckland",
      addressCountry: "NZ",
    },
    memberOf: {
      "@type": "Organization",
      name: BRAND.agencyName,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: AGENT_STATS.rmaRating,
      reviewCount: AGENT_STATS.rmaReviewCount,
      bestRating: "5",
    },
    sameAs: [RATE_MY_AGENT_URL, siteUrl("/about")],
  };
}

type ListingJsonInput = {
  slug: string;
  address: string;
  suburb?: string | null;
  city?: string | null;
  summary?: string | null;
  coverImageUrl?: string | null;
  listedPriceLabel?: string | null;
  soldPriceCents?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  propertyType?: string | null;
};

export function listingJsonLd(listing: ListingJsonInput) {
  const url = siteUrl(`/${listing.slug}`);
  const isForSale = ["FOR_SALE", "UNDER_OFFER", "COMING_SOON"].includes(
    listing.status
  );

  const place: Record<string, unknown> = {
    "@type": "Place",
    name: listing.address,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.suburb || undefined,
      addressRegion: listing.city || "Auckland",
      addressCountry: "NZ",
    },
  };

  if (listing.latitude != null && listing.longitude != null) {
    place.geo = {
      "@type": "GeoCoordinates",
      latitude: listing.latitude,
      longitude: listing.longitude,
    };
  }

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    url,
    availability: isForSale
      ? "https://schema.org/InStock"
      : "https://schema.org/SoldOut",
    seller: {
      "@type": "RealEstateAgent",
      name: BRAND.agentName,
      url: siteUrl("/"),
    },
  };

  if (isForSale && listing.listedPriceLabel) {
    offer.priceSpecification = {
      "@type": "PriceSpecification",
      priceCurrency: "NZD",
      description: listing.listedPriceLabel,
    };
  } else if (!isForSale && listing.soldPriceCents != null) {
    offer.price = Math.round(listing.soldPriceCents / 100);
    offer.priceCurrency = "NZD";
  }

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.address,
    description: listing.summary || undefined,
    url,
    image: listing.coverImageUrl || undefined,
    datePosted: undefined,
    about: {
      "@type": "Accommodation",
      name: listing.address,
      numberOfRooms: listing.bedrooms ?? undefined,
      numberOfBathroomsTotal: listing.bathrooms ?? undefined,
      ...(listing.propertyType
        ? { additionalType: listing.propertyType }
        : {}),
      ...(listing.parking != null
        ? {
            amenityFeature: {
              "@type": "LocationFeatureSpecification",
              name: "Parking",
              value: listing.parking,
            },
          }
        : {}),
    },
    contentLocation: place,
    offers: offer,
  };
}
