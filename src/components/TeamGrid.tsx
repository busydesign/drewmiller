import Image from "next/image";
import Link from "next/link";

export type TeamMemberCard = {
  slug: string;
  name: string;
  role?: string | null;
  photoUrl?: string | null;
  isLead?: boolean;
};

export function TeamGrid({
  members,
  compact = false,
}: {
  members: TeamMemberCard[];
  compact?: boolean;
}) {
  return (
    <div
      data-reveal-stagger
      className={`grid gap-6 ${
        compact
          ? "sm:grid-cols-2 lg:grid-cols-3"
          : "sm:grid-cols-2 lg:grid-cols-3"
      }`}
    >
      {members.map((member) => (
        <Link
          key={member.slug}
          href={`/team/${member.slug}`}
          className="group flex items-start gap-4 transition-transform duration-300 hover:-translate-y-0.5"
        >
          <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-line bg-mist md:h-24 md:w-24">
            {member.photoUrl ? (
              <Image
                src={member.photoUrl}
                alt={member.name}
                fill
                className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                sizes="96px"
                unoptimized
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-ink text-sm font-black text-rw-yellow">
                {member.name
                  .split(/\s+/)
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            )}
          </span>
          <span className="min-w-0 pt-1">
            {member.isLead && (
              <span className="mb-1 inline-block rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                Team lead
              </span>
            )}
            <span className="block text-xl font-medium leading-tight tracking-tight md:text-2xl">
              {member.name}
            </span>
            {member.role && (
              <span className="mt-1 block text-sm text-muted">
                {member.role}
              </span>
            )}
            <span className="mt-2 block text-[13px] text-ink-soft transition-opacity group-hover:opacity-70">
              View profile →
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
