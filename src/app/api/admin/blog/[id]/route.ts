import { PageKind } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  looksLikeHtml,
  plainTextToHtml,
  slugifyBlogTitle,
} from "@/lib/blog";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.contentPage.findFirst({
    where: { id, kind: PageKind.BLOG },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({
    post: {
      ...post,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      updatedAt: post.updatedAt.toISOString(),
      createdAt: post.createdAt.toISOString(),
    },
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.contentPage.findFirst({
    where: { id, kind: PageKind.BLOG },
  });
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
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

  const title = body.title?.trim() || existing.title;
  let slug = (body.slug ?? existing.slug).trim().replace(/^\/+|\/+$/g, "");
  slug = slug.replace(/^blog\//i, "");
  if (!slug || slug.includes("/")) {
    return NextResponse.json(
      { error: "Slug must be a single URL segment" },
      { status: 400 }
    );
  }

  if (slug !== existing.slug) {
    const clash = await prisma.contentPage.findUnique({ where: { slug } });
    if (clash) {
      return NextResponse.json(
        { error: `Slug “${slug}” is already in use` },
        { status: 409 }
      );
    }
  }

  const content =
    body.content !== undefined ? body.content.trim() : undefined;
  let bodyHtml = existing.bodyHtml;
  let bodyMarkdown = existing.bodyMarkdown;
  if (content !== undefined) {
    if (!content) {
      bodyHtml = null;
      bodyMarkdown = null;
    } else if (looksLikeHtml(content)) {
      bodyHtml = content;
      bodyMarkdown = null;
    } else {
      bodyHtml = plainTextToHtml(content);
      bodyMarkdown = content;
    }
  }

  const published =
    body.published !== undefined ? Boolean(body.published) : existing.published;
  let publishedAt = existing.publishedAt;
  if (body.publishedAt !== undefined) {
    publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
  } else if (published && !publishedAt) {
    publishedAt = new Date();
  }

  const post = await prisma.contentPage.update({
    where: { id },
    data: {
      title,
      slug,
      summary:
        body.summary !== undefined
          ? body.summary.trim() || null
          : existing.summary,
      coverImageUrl:
        body.coverImageUrl !== undefined
          ? body.coverImageUrl.trim() || null
          : existing.coverImageUrl,
      bodyHtml,
      bodyMarkdown,
      seoTitle: title || slugifyBlogTitle(title),
      seoDescription:
        body.summary !== undefined
          ? body.summary.trim() || null
          : existing.seoDescription,
      published,
      publishedAt,
    },
  });

  return NextResponse.json({ ok: true, post });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.contentPage.findFirst({
    where: { id, kind: PageKind.BLOG },
    select: { id: true, slug: true, title: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await prisma.contentPage.delete({ where: { id } });
  return NextResponse.json({
    ok: true,
    id: existing.id,
    slug: existing.slug,
    title: existing.title,
  });
}
