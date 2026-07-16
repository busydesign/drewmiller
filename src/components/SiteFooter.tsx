import Link from "next/link";
import { RATE_MY_AGENT_URL, RAY_WHITE_PROFILE_URL } from "@/lib/agent-proof";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper text-ink">
      <div className="shell grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-xl font-medium tracking-tight">Drew Miller</p>
          <p className="mt-2 text-sm text-ink-soft">
            Ray White Mairangi Bay &amp; Milford
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Elite North Shore specialist. Straight advice, sharp negotiation, and
            a track record you can explore.
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
              <a href="tel:0212788855" className="transition hover:text-ink">
                021 278 8855
              </a>
            </li>
            <li>
              <a
                href="mailto:drew@drewmiller.co.nz"
                className="transition hover:text-ink"
              >
                drew@drewmiller.co.nz
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
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-5 text-[12px] text-muted">
          <p>© {new Date().getFullYear()} Drew Miller · Ray White</p>
          <p>CR Marketing North Shore Limited · Licensed REAA 2008</p>
        </div>
      </div>
    </footer>
  );
}
