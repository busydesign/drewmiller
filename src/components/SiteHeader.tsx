import Link from "next/link";

const links = [
  { href: "/listings", label: "Current listings" },
  { href: "/sold", label: "Sold" },
  { href: "/team", label: "Team" },
  { href: "/map", label: "Sales map" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/60">
      <div className="shell flex h-14 items-center justify-between gap-6 md:h-16">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-[15px] font-medium tracking-tight md:text-base">
            Drew Miller
          </span>
          <span className="text-[11px] font-normal uppercase tracking-[0.08em] text-muted">
            Real estate
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] font-medium text-ink-soft lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-opacity hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/appraisal"
          className="btn btn-primary !min-h-9 !px-4 !py-1.5 text-[13px]"
        >
          Get appraisal
        </Link>
      </div>
    </header>
  );
}
