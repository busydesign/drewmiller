import Image from "next/image";
import Link from "next/link";

type Props = {
  pinCount: number;
};

function PromoPin({
  className,
  fill = "#171a20",
  delay,
}: {
  className: string;
  fill?: string;
  delay?: string;
}) {
  return (
    <span
      aria-hidden
      className={`map-promo-pin absolute drop-shadow-sm ${className}`}
      style={delay ? { animationDelay: delay } : undefined}
    >
      <svg width="20" height="26" viewBox="0 0 28 36" fill="none">
        <path
          d="M14 1.5C8.2 1.5 3.5 6.2 3.5 12c0 7.4 8.2 16.8 9.8 18.6a.9.9 0 0 0 1.4 0C16.3 28.8 24.5 19.4 24.5 12 24.5 6.2 19.8 1.5 14 1.5Z"
          fill={fill}
          stroke="#171a20"
          strokeWidth="1.5"
        />
        <circle
          cx="14"
          cy="12"
          r="4.2"
          fill={fill === "#ffe512" ? "#171a20" : "#ffe512"}
        />
      </svg>
    </span>
  );
}

export function SalesMapPromo({ pinCount }: Props) {
  const label =
    pinCount > 0
      ? `${pinCount.toLocaleString("en-NZ")} previous sales mapped`
      : "Previous sales mapped across the Shore";

  return (
    <section className="bg-paper">
      <div className="shell grid items-center gap-12 py-20 md:grid-cols-2 md:gap-16 md:py-28">
        <div className="max-w-xl">
          <p className="eyebrow">Sales map</p>
          <h2 className="display mt-3 text-4xl md:text-5xl">
            See what sold near you
          </h2>
          <p className="mt-4 text-base text-ink-soft md:text-lg">
            {label}. Yellow pins show completed sales across the Shore — so you
            can see the volume and spread of Drew’s results, then switch to
            homes currently for sale.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/map" className="btn btn-primary">
              Open sales map
            </Link>
            <Link href="/sold" className="btn btn-secondary">
              Browse sold archive
            </Link>
          </div>
        </div>

        <Link
          href="/map"
          className="group relative block overflow-hidden rounded-xl bg-paper"
          aria-label="Open sales map"
        >
          <div className="relative aspect-[4/3] w-full md:aspect-[5/4]">
            <Image
              src="/brand/sales-map-preview.jpg"
              alt="North Shore sales map preview"
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 540px"
            />
            <PromoPin className="left-[28%] top-[34%]" fill="#171a20" />
            <PromoPin
              className="left-[46%] top-[48%]"
              fill="#ffe512"
              delay="180ms"
            />
            <PromoPin
              className="left-[62%] top-[30%]"
              fill="#171a20"
              delay="360ms"
            />
            <PromoPin
              className="left-[72%] top-[58%]"
              fill="#ffe512"
              delay="520ms"
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <span className="text-[13px] text-muted">Live map preview</span>
            <span className="text-[13px] font-medium text-ink">Explore →</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
