import Image from "next/image";
import Link from "next/link";

type Props = {
  name: string;
  slug?: string | null;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  /** Disable when nested inside another link (e.g. listing cards). */
  link?: boolean;
  className?: string;
};

const SIZES = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-16 w-16",
} as const;

export function AgentAvatar({
  name,
  slug,
  photoUrl,
  size = "sm",
  showName = false,
  link = true,
  className = "",
}: Props) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatar = (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full border-2 border-paper bg-mist shadow-sm ${SIZES[size]} ${className}`}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={name}
          fill
          className="object-cover object-top"
          sizes="64px"
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-ink text-[10px] font-black text-rw-yellow">
          {initials}
        </span>
      )}
    </span>
  );

  const content = (
    <span className="inline-flex items-center gap-2">
      {avatar}
      {showName && (
        <span className="text-sm font-bold leading-tight">{name}</span>
      )}
    </span>
  );

  if (!slug || !link) return content;

  return (
    <Link
      href={`/team/${slug}`}
      className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
    >
      {content}
    </Link>
  );
}
