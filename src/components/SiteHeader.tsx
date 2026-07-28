"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { BRAND } from "@/lib/brand";

const links = [
  { href: "/listings", label: "Current listings" },
  { href: "/sold", label: "Sold" },
  { href: "/team", label: "Team" },
  { href: "/map", label: "Sales map" },
  { href: "/blog", label: "Market updates" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-paper/70">
        <div className="shell flex h-16 items-center justify-between gap-4 md:h-20 md:gap-6">
          <Link
            href="/"
            className="min-w-0 text-lg font-medium tracking-tight text-ink md:text-xl lg:text-2xl"
          >
            {BRAND.agentName}
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

          <div className="flex shrink-0 items-center gap-2 self-stretch sm:gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center self-center rounded-full border border-line-strong bg-paper text-ink transition-opacity hover:opacity-70 lg:hidden"
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              <span className="relative block h-3.5 w-4" aria-hidden>
                <span
                  className={`absolute left-0 h-[1.5px] w-full bg-current transition duration-300 ${
                    open ? "top-[6px] rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 top-[6px] h-[1.5px] w-full bg-current transition duration-300 ${
                    open ? "scale-x-0 opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 h-[1.5px] w-full bg-current transition duration-300 ${
                    open ? "top-[6px] -rotate-45" : "top-[12px]"
                  }`}
                />
              </span>
            </button>
            <Image
              src={BRAND.logoSrc}
              alt={BRAND.logoAlt}
              width={80}
              height={80}
              className="h-full w-auto shrink-0 object-contain"
              priority
            />
          </div>
        </div>
      </header>

      <div
        id={menuId}
        className={`fixed inset-0 z-[60] flex flex-col bg-paper transition-[opacity,visibility] duration-300 lg:hidden ${
          open
            ? "visible opacity-100"
            : "invisible pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="shell flex h-16 items-center justify-between gap-4 md:h-20">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="min-w-0 text-lg font-medium tracking-tight md:text-xl"
          >
            {BRAND.agentName}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-strong text-ink transition-opacity hover:opacity-70"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <span className="relative block h-3.5 w-4" aria-hidden>
              <span className="absolute left-0 top-[6px] h-[1.5px] w-full rotate-45 bg-current" />
              <span className="absolute left-0 top-[6px] h-[1.5px] w-full -rotate-45 bg-current" />
            </span>
          </button>
        </div>

        <nav className="shell flex flex-1 flex-col justify-center gap-1 pb-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="display border-b border-line py-4 text-3xl tracking-tight text-ink transition-opacity hover:opacity-60 sm:text-4xl"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="shell flex flex-col gap-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          <Link
            href="/appraisal"
            onClick={() => setOpen(false)}
            className="btn btn-primary w-full !min-h-12"
          >
            Get an Appraisal
          </Link>
          <a
            href={`tel:${BRAND.phoneHref}`}
            className="btn btn-secondary w-full !min-h-12"
          >
            Call {BRAND.phoneDisplay}
          </a>
        </div>
      </div>
    </>
  );
}
