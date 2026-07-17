"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingAppraisalButton() {
  const pathname = usePathname();
  if (pathname === "/appraisal" || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <Link
      href="/appraisal"
      className="btn btn-primary fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[45] !min-h-11 shadow-[0_10px_30px_rgb(0_0_0/0.12)] sm:right-6 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      Get an Appraisal
    </Link>
  );
}
