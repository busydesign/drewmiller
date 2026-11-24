import {
  isPrivateListingLink,
  labelForListingLink,
  normalizeListingUrl,
} from "@/lib/listing-links";

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
  const sourceRaw = sourceUrl ? normalizeListingUrl(sourceUrl) : null;
  const source =
    sourceRaw && !isPrivateListingLink(sourceRaw) ? sourceRaw : null;
  const extras = extraLinks.filter((link) => {
    const url = normalizeListingUrl(link.url);
    if (!url || url === source || isPrivateListingLink(url)) return false;
    return true;
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
          {labelForListingLink(source)}
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
