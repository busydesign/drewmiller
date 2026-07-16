import Image from "next/image";
import { RATE_MY_AGENT_URL, RMA_AWARD_BADGES } from "@/lib/agent-proof";

type Props = {
  className?: string;
  /** Show title/copy above the badges */
  showHeader?: boolean;
  /** Show title + description under each badge */
  showDetails?: boolean;
  /** Smaller icons in a single 5-wide row */
  compact?: boolean;
};

export function RmaBadgeStrip({
  className = "",
  showHeader = true,
  showDetails = true,
  compact = false,
}: Props) {
  return (
    <div className={className}>
      {showHeader && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Recognition</p>
            <h2 className="display mt-2 text-3xl md:text-4xl">Awards</h2>
            <p className="mt-2 max-w-lg text-ink-soft">
              Top 100 NZ 2026, Bayview Agent of the Year, and a 5.0 rating from
              140 client reviews.
            </p>
          </div>
          <a
            href={RATE_MY_AGENT_URL}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            Read client reviews
          </a>
        </div>
      )}

      <ul
        data-reveal-stagger
        className={
          compact
            ? `grid grid-cols-5 items-center justify-items-center gap-2 sm:gap-3 ${showHeader ? "mt-6" : ""}`
            : `mt-6 grid grid-cols-2 items-stretch sm:grid-cols-3 lg:grid-cols-5 ${showHeader ? "" : "mt-0"}`
        }
      >
        {RMA_AWARD_BADGES.map((badge, index) => (
          <li
            key={badge.id}
            className={
              compact
                ? "flex w-full max-w-[5.5rem] flex-col items-center text-center"
                : `flex flex-col items-center px-3 py-2 text-center sm:px-4 ${
                    index > 0 ? "lg:border-l lg:border-line" : ""
                  }`
            }
          >
            <div
              className={
                compact
                  ? "relative aspect-square w-full max-w-[4.75rem] sm:max-w-[5.25rem]"
                  : "relative h-24 w-20 sm:h-28 sm:w-24"
              }
            >
              <Image
                src={badge.image}
                alt={badge.title}
                fill
                className="object-contain"
                sizes={compact ? "84px" : "96px"}
              />
            </div>
            {showDetails && !compact && (
              <>
                <p className="mt-2.5 text-sm font-medium">{badge.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {badge.detail}
                </p>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
