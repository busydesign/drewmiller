import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/listings",
    "/sold",
    "/map",
    "/blog",
    "/appraisal",
    "/about",
    "/contact",
  ].map((path) => ({
    url: siteUrl(path || "/"),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  if (!process.env.DATABASE_URL) {
    return staticRoutes;
  }

  const [listings, pages, blogPosts] = await Promise.all([
    prisma.listing.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.contentPage.findMany({
      where: { published: true, NOT: { kind: "BLOG" } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.contentPage.findMany({
      where: {
        published: true,
        kind: "BLOG",
        NOT: { slug: { contains: "/" } },
      },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    ...staticRoutes,
    ...listings.map((listing) => ({
      url: siteUrl(`/${listing.slug}`),
      lastModified: listing.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...blogPosts.map((post) => ({
      url: siteUrl(`/blog/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    ...pages
      .filter((p) => !p.slug.includes("/"))
      .map((page) => ({
        url: siteUrl(`/${page.slug}`),
        lastModified: page.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
  ];
}
