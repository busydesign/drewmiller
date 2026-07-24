import Image from "next/image";
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

/** Cover image, or Ray White yellow tile with logo when missing. */
export function BlogCover({
  src,
  alt = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw",
  className = "",
  aspectClassName = "aspect-[16/10]",
}: Props) {
  return (
    <div
      className={`relative overflow-hidden ${aspectClassName} ${className}`.trim()}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
          sizes={sizes}
          priority={priority}
        />
      ) : (
        <div
          className="absolute inset-0 grid place-items-center px-6"
          style={{ backgroundColor: RW_YELLOW }}
          aria-hidden
        >
          <div className="flex w-full max-w-[11rem] flex-col items-center gap-2">
            <Image
              src={BRAND.logoSrc}
              alt=""
              width={176}
              height={176}
              className="h-auto w-full object-contain"
            />
            <p className="text-center text-[11px] font-semibold tracking-tight text-ink">
              {BRAND.agentName}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
