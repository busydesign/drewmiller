import { PageKind } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  looksLikeHtml,
  plainTextToHtml,
  slugifyBlogTitle,
} from "@/lib/blog";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await prisma.contentPage.findMany({
    where: { kind: PageKind.BLOG },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: string;
    slug?: string;
    summary?: string;
    coverImageUrl?: string;
    content?: string;
    published?: boolean;
    publishedAt?: string | null;
  };

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  let slug = (body.slug || slugifyBlogTitle(title)).trim().replace(/^\/+|\/+$/g, "");
  slug = slug.replace(/^blog\//i, "");
  if (!slug || slug.includes("/")) {
    return NextResponse.json(
      { error: "Slug must be a single URL segment" },
      { status: 400 }
    );
  }

  const existing = await prisma.contentPage.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: `Slug “${slug}” is already in use` },
      { status: 409 }
    );
  }

  const content = body.content?.trim() || "";
  const bodyHtml = content
    ? looksLikeHtml(content)
      ? content
      : plainTextToHtml(content)
    : null;
  const bodyMarkdown = content && !looksLikeHtml(content) ? content : null;

  const published = body.published !== false;
  const publishedAt = body.publishedAt
    ? new Date(body.publishedAt)
    : published
      ? new Date()
      : null;

  const post = await prisma.contentPage.create({
    data: {
      slug,
      kind: PageKind.BLOG,
      title,
      summary: body.summary?.trim() || null,
      coverImageUrl: body.coverImageUrl?.trim() || null,
      bodyHtml,
      bodyMarkdown,
      seoTitle: title,
      seoDescription: body.summary?.trim() || null,
      published,
      publishedAt,
    },
  });

  return NextResponse.json({ ok: true, post });
}
