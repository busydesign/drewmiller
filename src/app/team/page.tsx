import type { Metadata } from "next";
import Link from "next/link";
import { TeamGrid } from "@/components/TeamGrid";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "The team",
  description:
    "Meet Drew Miller’s Ray White Mairangi Bay team — North Shore specialists working under Drew’s umbrella.",
};

export default async function TeamPage() {
  const members = await prisma.agent.findMany({
    where: { published: true },
    orderBy: [{ isLead: "desc" }, { sortOrder: "asc" }],
  });

  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow">Drew Miller Realty</p>
        <h1 className="display mt-2 text-5xl md:text-6xl">The team</h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          Drew leads a focused sales team at Ray White Mairangi Bay &amp; Milford.
          Every listing on this site sits under his umbrella — with a clear lead
          agent on each property.
        </p>

        <div className="mt-12">
          <TeamGrid members={members} />
        </div>

        <div className="mt-14 flex flex-wrap gap-3 border-t border-line pt-8">
          <Link href="/listings" className="btn btn-primary">
            Team listings
          </Link>
          <Link href="/appraisal" className="btn btn-secondary">
            Request an appraisal
          </Link>
        </div>
      </div>
    </section>
  );
}
