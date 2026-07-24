import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCover } from "@/components/BlogCover";
import { cleanMigratedBodyHtml } from "@/lib/clean-migrated-html";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.contentPage.findFirst({
    where: { slug, kind: "BLOG", published: true },
  });
  if (!post) return {};
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.summary || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: post.coverImageUrl
      ? { images: [{ url: post.coverImageUrl }] }
      : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.contentPage.findFirst({
    where: { slug, kind: "BLOG", published: true },
  });
  if (!post) notFound();

  const html = cleanMigratedBodyHtml(post.bodyHtml);
  const date = formatDate(post.publishedAt);

  return (
    <article>
      <section className="section pb-0">
        <div className="shell max-w-3xl">
          <Link
            href="/blog"
            className="text-sm font-medium text-ink-soft transition-opacity hover:opacity-70"
          >
            ← Market updates
          </Link>
          <p className="eyebrow mt-6">Blog</p>
          <h1 className="display mt-2 text-4xl md:text-5xl">{post.title}</h1>
          {date ? (
            <p className="mt-4 text-sm text-muted">{date}</p>
          ) : null}
          {post.summary ? (
            <p className="mt-4 text-lg text-ink-soft">{post.summary}</p>
          ) : null}
        </div>
      </section>

      <div className="shell mt-10 max-w-4xl">
        <BlogCover
          src={post.coverImageUrl}
          aspectClassName="aspect-[16/9]"
          sizes="(max-width: 896px) 100vw, 896px"
          priority
        />
      </div>

      <section className="section pt-10">
        <div className="shell max-w-3xl">
          {html ? (
            <div
              className="prose-site space-y-4"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : post.bodyMarkdown ? (
            <div className="prose-site whitespace-pre-wrap">
              {post.bodyMarkdown}
            </div>
          ) : null}

          <div className="mt-14 border-t border-line pt-10">
            <p className="eyebrow">Next step</p>
            <h2 className="display mt-2 text-3xl">
              Want a local market read?
            </h2>
            <p className="mt-3 max-w-md text-sm text-ink-soft">
              Get a clear appraisal and recent sales around your address.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/appraisal" className="btn btn-primary">
                Get an appraisal
              </Link>
              <Link href="/blog" className="btn btn-secondary">
                More updates
              </Link>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
