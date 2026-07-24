import type { Metadata } from "next";
import Link from "next/link";
import { BlogCover } from "@/components/BlogCover";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Market updates & blog",
  description:
    "North Shore market updates, selling advice, and local property insights from Drew Miller.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const posts = process.env.DATABASE_URL
    ? await prisma.contentPage.findMany({
        where: {
          published: true,
          kind: "BLOG",
          NOT: { slug: { contains: "/" } },
        },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        select: {
          slug: true,
          title: true,
          summary: true,
          coverImageUrl: true,
          publishedAt: true,
        },
      })
    : [];

  return (
    <section className="section">
      <div className="shell">
        <div className="max-w-2xl">
          <p className="eyebrow">Insights</p>
          <h1 className="display mt-2 text-4xl md:text-5xl">
            Market updates
          </h1>
          <p className="mt-3 text-ink-soft">
            Local North Shore context — what has sold, where activity sits, and
            how that informs your next move.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="mt-12 border border-line bg-mist px-6 py-10">
            <p className="text-lg font-medium tracking-tight">
              New posts coming soon
            </p>
            <p className="mt-2 max-w-md text-sm text-ink-soft">
              Looking for recent sales instead? Explore the map or sold archive.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/map" className="btn btn-primary">
                Open sales map
              </Link>
              <Link href="/appraisal" className="btn btn-secondary">
                Get an appraisal
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const date = formatDate(post.publishedAt);
              return (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <BlogCover src={post.coverImageUrl} />
                    {date ? (
                      <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                        {date}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[15px] font-medium leading-snug tracking-tight">
                      {post.title}
                    </p>
                    {post.summary ? (
                      <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
                        {post.summary}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
