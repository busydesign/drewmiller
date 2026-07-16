import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
};

export function HeroBanner({
  children,
  imageSrc = "/brand/hero-team.png",
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
        className="object-cover object-[center_30%]"
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-ink/30 via-ink/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />

      <div className="shell relative flex min-h-[78vh] items-end py-16 md:min-h-[86vh] md:py-24">
        <div className="w-full max-w-2xl pr-20 sm:pr-24 md:pr-0">
          {children}
        </div>

        <div className="pointer-events-none absolute bottom-6 right-4 z-10 sm:bottom-8 sm:right-6 md:bottom-10 md:right-8">
          <Image
            src="/brand/ray-white.png"
            alt="Ray White"
            width={112}
            height={112}
            className="h-14 w-14 rounded-sm shadow-[0_12px_40px_rgb(0_0_0/0.35)] sm:h-16 sm:w-16 md:h-20 md:w-20"
            priority
          />
        </div>
      </div>
    </section>
  );
}
