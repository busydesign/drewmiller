"use client";

import Image from "next/image";
import { useState } from "react";
import { BRAND, RW_YELLOW } from "@/lib/brand";

type Props = {
  src?: string | null;
  alt?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Aspect ratio class, e.g. aspect-[16/10] */
  aspectClassName?: string;
};

/** Squarespace leftover covers that resolve to the grey diagonal placeholder. */
export function isUsableCoverUrl(url?: string | null): url is string {
  if (!url?.trim()) return false;
  const value = url.trim().toLowerCase();
  if (value.includes("no-image.png")) return false;
  // Migrated folder URLs without a filename → Squarespace no-image redirect
  if (/\/\d{10,}\/?$/.test(value) && !/\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(value)) {
    return false;
  }
  return true;
}

function YellowBrandTile() {
  return (
    <div
      className="absolute inset-0 grid place-items-center px-6"
      style={{ backgroundColor: RW_YELLOW }}
      aria-hidden
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xl font-semibold tracking-tight text-ink md:text-2xl">
          {BRAND.agentName}
        </p>
        <Image
          src={BRAND.logoSrc}
          alt=""
          width={96}
          height={96}
          className="h-10 w-10 rounded-sm object-cover object-bottom"
        />
      </div>
    </div>
  );
}

/** Cover image, or yellow Drew Miller tile when missing/broken. */
export function BlogCover({
  src,
  alt = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw",
  className = "",
  aspectClassName = "aspect-[16/10]",
}: Props) {
  const usable = isUsableCoverUrl(src);
  const [failed, setFailed] = useState(false);
  const showImage = usable && !failed;

  return (
    <div
      className={`relative overflow-hidden ${aspectClassName} ${className}`.trim()}
    >
      {showImage ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
        />
      ) : (
        <YellowBrandTile />
      )}
    </div>
  );
}
