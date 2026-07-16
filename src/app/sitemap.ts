import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/format";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, pages] = await Promise.all([
    prisma.listing.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.contentPage.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticRoutes = [
    "",
    "/listings",
    "/sold",
    "/map",
    "/appraisal",
    "/about",
    "/contact",
  ].map(
    (path) => ({
      url: siteUrl(path || "/"),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })
  );

  return [
    ...staticRoutes,
    ...listings.map((listing) => ({
      url: siteUrl(`/${listing.slug}`),
      lastModified: listing.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
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
