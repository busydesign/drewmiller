/**
 * Pull blog posts from the live Squarespace site and upsert ContentPage BLOG rows
 * with flat slugs suitable for /blog/[slug].
 *
 * Usage: npx tsx scripts/sync-blog-from-squarespace.ts
 */
import "dotenv/config";
import { PageKind, PrismaClient } from "@prisma/client";
import {
  blogSlugFromPath,
  decodeBasicEntities,
} from "../src/lib/blog";

const BASE = "https://www.drewmiller.co.nz";
const prisma = new PrismaClient();

type SqItem = {
  title?: string;
  fullUrl?: string;
  publishOn?: number;
  assetUrl?: string;
  excerpt?: string;
  body?: string;
};

async function fetchJson(path: string) {
  const res = await fetch(`${BASE}${path}${path.includes("?") ? "&" : "?"}format=json`, {
    headers: { "User-Agent": "DrewMillerBlogSync/1.0" },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${path}`);
  return res.json() as Promise<{ items?: SqItem[]; item?: SqItem; collection?: { itemCount?: number } }>;
}

function stripTags(html: string): string {
  return decodeBasicEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const list = await fetchJson("/blog");
  const paths = new Set(
    (list.items || [])
      .map((item) => item.fullUrl)
      .filter((url): url is string => Boolean(url))
  );

  // Ensure known archive URLs are included even if pagination truncates the index.
  for (const path of [
    "/blog/2018/3/15/february-predictions-for-house-prices",
    "/blog/2019/10/1/the-auckland-property-information-smells-like-spring-is-here",
    "/blog/2019/2/22/drews-news",
    "/blog/2020/6/15/drew-miller-central-realty-he-who-laughs-loudest-sells-houses",
    "/blog/2022/9/19/will-your-90s-house-renovations-cost-you-when-its-time-to-sellnbsp",
    "/blog/2023/2/2/how-do-agents-bridge-gap-between-what-you-want-and-what-youll-get",
    "/blog/2023/6/6/mom-n-pop-investors-moving-to-sell-up-amid-recession-fear",
    "/blog/2023/6/6/unlock-the-matakana-lifestyle-earn-while-you-sleep-1",
    "/blog/2025/11/3/diy-home-improvements-could-cost-homeowners-thousands-and-even-jeopardise-a-sale",
    "/blog/march-predictions-for-auckland-house-prices",
  ]) {
    paths.add(path);
  }

  console.log(`Syncing ${paths.size} Squarespace blog URLs…`);

  // Remove the old blog index ContentPage (slug "blog") — real index is /blog route.
  const removedIndex = await prisma.contentPage.deleteMany({
    where: { slug: "blog" },
  });
  if (removedIndex.count) {
    console.log(`Removed legacy ContentPage slug=blog`);
  }

  let upserted = 0;
  for (const path of paths) {
    const data = await fetchJson(path);
    const item = data.item;
    if (!item?.fullUrl || !item.title) {
      console.warn(`Skip (no item): ${path}`);
      continue;
    }

    const slug = blogSlugFromPath(item.fullUrl)
      .replace(/nbsp$/i, "")
      .replace(/-+$/g, "");
    const title = decodeBasicEntities(item.title);
    const summary = item.excerpt ? stripTags(item.excerpt).slice(0, 280) : null;
    const publishedAt = item.publishOn ? new Date(item.publishOn) : new Date();
    const coverImageUrl =
      item.assetUrl && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(item.assetUrl)
        ? item.assetUrl
        : item.assetUrl?.includes("squarespace")
          ? item.assetUrl
          : null;

    // Prefer existing migrated HTML if body is empty/short; otherwise use live body.
    const existing = await prisma.contentPage.findFirst({
      where: {
        OR: [
          { slug },
          { slug: item.fullUrl.replace(/^\//, "") },
          { slug: { endsWith: `/${slug}` } },
        ],
        kind: PageKind.BLOG,
      },
    });

    const bodyHtml = item.body?.trim() || existing?.bodyHtml || null;
    const bodyMarkdown = existing?.bodyMarkdown || null;

    await prisma.contentPage.upsert({
      where: { slug },
      create: {
        slug,
        kind: PageKind.BLOG,
        title,
        summary,
        bodyHtml,
        bodyMarkdown,
        coverImageUrl: coverImageUrl || existing?.coverImageUrl || null,
        seoTitle: title,
        seoDescription: summary,
        published: true,
        publishedAt,
      },
      update: {
        kind: PageKind.BLOG,
        title,
        summary: summary || existing?.summary || null,
        bodyHtml: bodyHtml || existing?.bodyHtml || null,
        coverImageUrl: coverImageUrl || existing?.coverImageUrl || null,
        seoTitle: title,
        seoDescription: summary || existing?.seoDescription || null,
        published: true,
        publishedAt,
      },
    });

    // Clean up legacy nested slug rows after flat upsert.
    if (existing && existing.slug !== slug) {
      await prisma.contentPage.delete({ where: { id: existing.id } }).catch(() => null);
    }

    upserted += 1;
    console.log(`✓ ${slug} · ${publishedAt.toISOString().slice(0, 10)}`);
  }

  // Delete any remaining nested blog/* rows that weren't remapped.
  const stale = await prisma.contentPage.deleteMany({
    where: {
      kind: PageKind.BLOG,
      slug: { contains: "/" },
    },
  });
  if (stale.count) {
    console.log(`Removed ${stale.count} nested-slug blog rows`);
  }

  const total = await prisma.contentPage.count({ where: { kind: PageKind.BLOG } });
  console.log(`Done. Upserted ${upserted}. Blog posts in DB: ${total}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
