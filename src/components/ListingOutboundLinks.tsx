import { normalizeListingUrl } from "@/lib/listing-links";

type ExtraLink = {
  label: string;
  url: string;
};

export function ListingOutboundLinks({
  sourceUrl,
  extraLinks,
}: {
  sourceUrl: string | null;
  extraLinks: ExtraLink[];
}) {
  const source = sourceUrl ? normalizeListingUrl(sourceUrl) : null;
  const extras = extraLinks.filter((link) => {
    const url = normalizeListingUrl(link.url);
    return Boolean(url) && url !== source;
  });

  if (!source && extras.length === 0) return null;

  return (
    <>
      {source ? (
        <a
          href={source}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary mt-6 w-full"
        >
          View on Ray White
        </a>
      ) : null}
      {extras.map((link, index) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className={`btn btn-secondary w-full ${
            source || index > 0 ? "mt-3" : "mt-6"
          }`}
        >
          {link.label}
        </a>
      ))}
    </>
  );
}
