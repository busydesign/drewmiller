import Image from "next/image";
import Link from "next/link";
import { RATE_MY_AGENT_URL, RAY_WHITE_PROFILE_URL } from "@/lib/agent-proof";
import { BRAND, BRAND_DISCLAIMER } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper text-ink">
      <div className="shell grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-start gap-4">
            <Image
              src={BRAND.logoSrc}
              alt={BRAND.logoAlt}
              width={48}
              height={48}
              className="h-12 w-12 shrink-0"
            />
            <div>
              <p className="text-xl font-medium tracking-tight">
                {BRAND.agentName}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{BRAND.agencyName}</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Elite North Shore specialist. Straight advice, sharp negotiation, and
            a track record you can explore — backed by the Ray White network.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-4 text-[12px] font-medium text-muted">Explore</p>
          <ul className="space-y-2.5 text-ink-soft">
            <li>
              <Link href="/listings" className="transition hover:text-ink">
                Current listings
              </Link>
            </li>
            <li>
              <Link href="/sold" className="transition hover:text-ink">
                Sold properties
              </Link>
            </li>
            <li>
              <Link href="/team" className="transition hover:text-ink">
                The team
              </Link>
            </li>
            <li>
              <Link href="/map" className="transition hover:text-ink">
                Sales map
              </Link>
            </li>
            <li>
              <Link href="/appraisal" className="transition hover:text-ink">
                Request appraisal
              </Link>
            </li>
            <li>
              <a
                href={RATE_MY_AGENT_URL}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-ink"
              >
                Client reviews
              </a>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-4 text-[12px] font-medium text-muted">Contact</p>
          <ul className="space-y-2.5 text-ink-soft">
            <li>
              <a
                href={`tel:${BRAND.phoneHref}`}
                className="transition hover:text-ink"
              >
                {BRAND.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${BRAND.email}`}
                className="transition hover:text-ink"
              >
                {BRAND.email}
              </a>
            </li>
            <li>
              <a
                href={RAY_WHITE_PROFILE_URL}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-ink"
              >
                Ray White profile
              </a>
            </li>
            <li>
              <Link href="/admin" className="transition hover:text-ink">
                Agent login
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="shell space-y-2 py-5 text-[12px] text-muted">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>
              © {new Date().getFullYear()} {BRAND.agentName} · {BRAND.agencyName}
            </p>
            <p>
              {BRAND.licensedEntity} · {BRAND.licensingLine}
            </p>
          </div>
          <p className="max-w-3xl leading-relaxed">{BRAND_DISCLAIMER}</p>
        </div>
      </div>
    </footer>
  );
}
