import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
};

export function HeroBanner({
  children,
  imageSrc = "/brand/hero-team.jpg",
  imageAlt = "Drew Miller and the Ray White North Shore team",
}: Props) {
  return (
    <section
      data-reveal-skip
      className="relative min-h-[78vh] overflow-hidden bg-ink md:min-h-[86vh]"
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        className="object-cover object-[center_45%]"
        sizes="100vw"
      />

      {/* Left/bottom scrim so brand type stays readable on the photo */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-ink/25 to-transparent md:via-ink/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />

      <div className="shell relative flex min-h-[78vh] items-end py-16 md:min-h-[86vh] md:py-24">
        <div className="w-full max-w-3xl">{children}</div>
      </div>
    </section>
  );
}
