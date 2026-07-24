"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { slugifyBlogTitle } from "@/lib/blog";

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  bodyHtml: string | null;
  bodyMarkdown: string | null;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

type Props = {
  posts: BlogPostRow[];
};

type FormState = {
  title: string;
  slug: string;
  summary: string;
  coverImageUrl: string;
  content: string;
  published: boolean;
  publishedAt: string;
};

const emptyForm = (): FormState => ({
  title: "",
  slug: "",
  summary: "",
  coverImageUrl: "",
  content: "",
  published: true,
  publishedAt: new Date().toISOString().slice(0, 10),
});

function toForm(post: BlogPostRow): FormState {
  return {
    title: post.title,
    slug: post.slug,
    summary: post.summary || "",
    coverImageUrl: post.coverImageUrl || "",
    content: post.bodyHtml || post.bodyMarkdown || "",
    published: post.published,
    publishedAt: post.publishedAt
      ? post.publishedAt.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  };
}

export function AdminBlogManager({ posts }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);

  const sorted = useMemo(
    () =>
      [...posts].sort((a, b) => {
        const ad = a.publishedAt || a.updatedAt;
        const bd = b.publishedAt || b.updatedAt;
        return bd.localeCompare(ad);
      }),
    [posts]
  );

  function startCreate() {
    setEditingId("new");
    setForm(emptyForm());
    setSlugTouched(false);
    setMessage(null);
  }

  async function startEdit(post: BlogPostRow) {
    setEditingId(post.id);
    setForm(toForm(post));
    setSlugTouched(true);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load post");
      const full = data.post as BlogPostRow;
      setForm(toForm(full));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load post");
    } finally {
      setBusy(false);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
    setSlugTouched(false);
  }

  async function save() {
    if (!form.title.trim()) {
      setMessage("Title is required");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugifyBlogTitle(form.title),
        summary: form.summary.trim(),
        coverImageUrl: form.coverImageUrl.trim(),
        content: form.content,
        published: form.published,
        publishedAt: form.publishedAt || null,
      };

      const isNew = editingId === "new";
      const res = await fetch(
        isNew ? "/api/admin/blog" : `/api/admin/blog/${editingId}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage(`${isNew ? "Published" : "Updated"} /blog/${data.post.slug}`);
      cancelEdit();
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function uploadCover(file: File | null) {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm((prev) => ({ ...prev, coverImageUrl: data.url as string }));
      setMessage(`Uploaded cover · ${data.filename}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove(post: BlogPostRow) {
    const ok = window.confirm(
      `Delete “${post.title}”?\n\nThis removes /blog/${post.slug} and can’t be undone.`
    );
    if (!ok) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMessage(`Deleted /blog/${data.slug}`);
      if (editingId === post.id) cancelEdit();
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-line bg-paper p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="display text-3xl">Market updates</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {posts.length} posts · edit content, covers, and publish state
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={startCreate}
          disabled={busy || editingId === "new"}
        >
          New post
        </button>
      </div>

      {message ? <p className="mt-4 text-sm text-sea-deep">{message}</p> : null}

      {editingId ? (
        <div className="mt-6 space-y-4 border border-line bg-mist p-5">
          <p className="text-sm font-medium">
            {editingId === "new" ? "Create post" : "Edit post"}
          </p>
          <label className="block text-sm">
            <span className="text-muted">Title</span>
            <input
              className="mt-1 w-full border border-line bg-white px-3 py-2.5"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  title,
                  slug: slugTouched ? prev.slug : slugifyBlogTitle(title),
                }));
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Slug</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-muted">/blog/</span>
              <input
                className="w-full border border-line bg-white px-3 py-2.5"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((prev) => ({ ...prev, slug: e.target.value }));
                }}
              />
            </div>
          </label>
          <label className="block text-sm">
            <span className="text-muted">Summary</span>
            <textarea
              className="mt-1 w-full border border-line bg-white px-3 py-2.5"
              rows={2}
              value={form.summary}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, summary: e.target.value }))
              }
            />
          </label>
          <div className="block text-sm">
            <span className="text-muted">Cover image</span>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  className="w-full border border-line bg-white px-3 py-2.5"
                  value={form.coverImageUrl}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      coverImageUrl: e.target.value,
                    }))
                  }
                  placeholder="https://… or upload below"
                />
                <label className="inline-flex cursor-pointer items-center">
                  <span className="btn btn-secondary !min-h-10">
                    {uploading ? "Uploading…" : "Upload image"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={busy || uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      e.target.value = "";
                      void uploadCover(file);
                    }}
                  />
                </label>
                <p className="text-xs text-muted">
                  JPG, PNG, WebP or GIF · max 8MB · stored on the server
                </p>
              </div>
              {form.coverImageUrl ? (
                <div className="relative h-28 w-full shrink-0 overflow-hidden border border-line bg-white sm:w-44">
                  <img
                    src={form.coverImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
          <label className="block text-sm">
            <span className="text-muted">Body (HTML or plain text)</span>
            <textarea
              className="mt-1 w-full border border-line bg-white px-3 py-2.5 font-mono text-xs leading-relaxed"
              rows={14}
              value={form.content}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, content: e.target.value }))
              }
            />
          </label>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, published: e.target.checked }))
                }
              />
              Published
            </label>
            <label className="text-sm">
              <span className="text-muted">Publish date</span>
              <input
                type="date"
                className="ml-2 border border-line bg-white px-3 py-2"
                value={form.publishedAt}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, publishedAt: e.target.value }))
                }
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={save}
              disabled={busy || uploading}
            >
              {busy ? "Saving…" : "Save post"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cancelEdit}
              disabled={busy || uploading}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <ul className="mt-6 divide-y divide-line border border-line bg-white">
        {sorted.length === 0 ? (
          <li className="px-4 py-6 text-sm text-ink-soft">No blog posts yet.</li>
        ) : (
          sorted.map((post) => (
            <li key={post.id} className="px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="font-medium underline"
                      target="_blank"
                    >
                      {post.title}
                    </Link>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                        post.published
                          ? "bg-rw-yellow text-ink"
                          : "border border-line text-muted"
                      }`}
                    >
                      {post.published ? "Live" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    /blog/{post.slug}
                    {post.publishedAt
                      ? ` · ${post.publishedAt.slice(0, 10)}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary !min-h-9 !px-3 !py-1.5 text-xs"
                    onClick={() => startEdit(post)}
                    disabled={busy}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary !min-h-9 !px-3 !py-1.5 text-xs"
                    onClick={() => remove(post)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
