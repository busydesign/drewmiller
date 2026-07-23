"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AdminBlogManager,
  type BlogPostRow,
} from "@/components/admin/AdminBlogManager";

type ListingRow = {
  id: string;
  slug: string;
  address: string;
  suburb: string | null;
  status: string;
  published: boolean;
  sourceUrl: string | null;
  importSource: string | null;
  coverImageUrl: string | null;
  updatedAt: string;
};

type LeadRow = {
  id: string;
  name: string;
  email: string;
  address: string;
  createdAt: string;
};

type Props = {
  listings: ListingRow[];
  leads: LeadRow[];
  blogPosts: BlogPostRow[];
  settings: {
    siteName: string;
    rateMyAgentUrl: string;
  } | null;
};

type TabId = "blog" | "listings" | "leads";

const TABS: { id: TabId; label: string }[] = [
  { id: "blog", label: "Blog" },
  { id: "listings", label: "Listings" },
  { id: "leads", label: "Leads" },
];

export function AdminDashboard({
  listings,
  leads,
  blogPosts,
  settings,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("blog");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FOR_SALE" | "SOLD">(
    "ALL"
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (statusFilter !== "ALL") {
        const isCurrent = ["FOR_SALE", "UNDER_OFFER", "COMING_SOON"].includes(
          listing.status
        );
        if (statusFilter === "FOR_SALE" && !isCurrent) return false;
        if (statusFilter === "SOLD" && listing.status !== "SOLD") return false;
      }
      if (!q) return true;
      const hay = [
        listing.address,
        listing.suburb,
        listing.slug,
        listing.sourceUrl,
        listing.importSource,
        listing.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return q.split(/\s+/).every((token) => hay.includes(token));
    });
  }, [listings, query, statusFilter]);

  const tabCounts: Record<TabId, number> = {
    blog: blogPosts.length,
    listings: listings.length,
    leads: leads.length,
  };

  async function previewImport() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/listing-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, mode: "preview" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import preview failed");
      setPreview(data.preview);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function publishImport(opts?: { listingId?: string; url?: string }) {
    const publishUrl = (opts?.url ?? url).trim();
    if (!publishUrl) return;

    if (opts?.listingId) setRowBusyId(opts.listingId);
    else setBusy(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/listing-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: publishUrl,
          mode: "publish",
          listingId: opts?.listingId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");
      setMessage(
        `${data.updated ? "Updated" : "Published"} /${data.slug} · ${data.images || 0} photos`
      );
      if (!opts?.listingId) {
        setPreview(null);
        setUrl("");
      }
      setEditingId(null);
      setEditUrl("");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
      setRowBusyId(null);
    }
  }

  async function deleteListing(listing: ListingRow) {
    const ok = window.confirm(
      `Delete “${listing.address}”?\n\nThis removes the page /${listing.slug} and can’t be undone.`
    );
    if (!ok) return;

    setRowBusyId(listing.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMessage(`Deleted /${data.slug}`);
      if (editingId === listing.id) {
        setEditingId(null);
        setEditUrl("");
      }
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setRowBusyId(null);
    }
  }

  function startEdit(listing: ListingRow) {
    setEditingId(listing.id);
    setEditUrl(listing.sourceUrl || "");
    setMessage(null);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <section className="section" data-reveal-skip>
      <div className="shell space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Admin</p>
            <h1 className="display mt-2 text-4xl">
              {settings?.siteName || "Drew Miller"} live desk
            </h1>
          </div>
          <button type="button" className="btn btn-secondary" onClick={logout}>
            Log out
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Admin sections"
          className="flex flex-wrap gap-2 border-b border-line pb-3"
        >
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                id={`admin-tab-${item.id}`}
                aria-controls={`admin-panel-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-ink text-white"
                    : "border border-line bg-paper text-ink-soft hover:text-ink"
                }`}
              >
                {item.label}
                <span
                  className={`text-xs tabular-nums ${
                    active ? "text-white/70" : "text-muted"
                  }`}
                >
                  {tabCounts[item.id]}
                </span>
              </button>
            );
          })}
        </div>

        {tab === "blog" ? (
          <div
            role="tabpanel"
            id="admin-panel-blog"
            aria-labelledby="admin-tab-blog"
          >
            <AdminBlogManager posts={blogPosts} />
          </div>
        ) : null}

        {tab === "listings" ? (
          <div
            role="tabpanel"
            id="admin-panel-listings"
            aria-labelledby="admin-tab-listings"
            className="space-y-8"
          >
            <div className="border border-line bg-paper p-6">
              <p className="eyebrow">Add / refresh listing</p>
              <h2 className="display mt-2 text-3xl">Paste a listing URL</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Best from rwmairangibay.co.nz or raywhite.co.nz. Publishing
                updates an existing page if the source URL already matches — or
                use Edit on a listing below to refresh a specific page.
              </p>
              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://rwmairangibay.co.nz/properties/.../3525909"
                  className="flex-1 border border-line px-3 py-3 text-sm"
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={previewImport}
                  disabled={busy || !url}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => publishImport()}
                  disabled={busy || !url}
                >
                  Publish listing
                </button>
              </div>
              {message ? (
                <p className="mt-3 text-sm text-sea-deep">{message}</p>
              ) : null}
              {preview ? (
                <div className="mt-4 space-y-3">
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <p>
                      <span className="font-bold">Source:</span>{" "}
                      {String(preview.source || "")}
                    </p>
                    <p>
                      <span className="font-bold">Address:</span>{" "}
                      {String(preview.propertyAddress || "")}
                    </p>
                    <p>
                      <span className="font-bold">Price:</span>{" "}
                      {String(preview.listedPriceLabel || "—")}
                    </p>
                    <p>
                      <span className="font-bold">Photos:</span>{" "}
                      {Array.isArray(preview.galleryUrls)
                        ? preview.galleryUrls.length
                        : 0}
                    </p>
                  </div>
                  <pre className="max-h-64 overflow-auto bg-mist p-4 text-xs">
                    {JSON.stringify(preview, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>

            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="display text-3xl">Listings</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    {filtered.length} shown · {listings.length} total
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["ALL", "All"],
                      ["FOR_SALE", "Current"],
                      ["SOLD", "Sold"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value)}
                      className={`px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] ${
                        statusFilter === value
                          ? "bg-rw-yellow text-ink"
                          : "border border-line bg-paper text-ink-soft"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-4 block">
                <span className="sr-only">Search listings</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search address, suburb, slug, source…"
                  className="w-full border border-line px-3 py-3 text-sm"
                />
              </label>

              <ul className="mt-4 divide-y divide-line border border-line bg-paper">
                {filtered.length === 0 ? (
                  <li className="px-4 py-6 text-sm text-ink-soft">
                    No listings match that search.
                  </li>
                ) : null}
                {filtered.map((listing) => {
                  const rowBusy = rowBusyId === listing.id;
                  const isEditing = editingId === listing.id;
                  const isCurrent = [
                    "FOR_SALE",
                    "UNDER_OFFER",
                    "COMING_SOON",
                  ].includes(listing.status);
                  return (
                    <li key={listing.id} className="px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/${listing.slug}`}
                              className="font-medium underline"
                              target="_blank"
                            >
                              {listing.address}
                            </Link>
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                                isCurrent
                                  ? "bg-rw-yellow text-ink"
                                  : "bg-ink text-white"
                              }`}
                            >
                              {listing.status.replace("_", " ")}
                            </span>
                            {!listing.published ? (
                              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                                Unpublished
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-ink-soft">
                            {listing.suburb || "North Shore"} · /{listing.slug}
                            {listing.importSource
                              ? ` · ${listing.importSource}`
                              : ""}
                          </p>
                          {listing.sourceUrl ? (
                            <a
                              href={listing.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block truncate text-xs text-ink-soft underline"
                            >
                              {listing.sourceUrl}
                            </a>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em]"
                            onClick={() => startEdit(listing)}
                            disabled={rowBusy}
                          >
                            Edit
                          </button>
                          {listing.sourceUrl ? (
                            <button
                              type="button"
                              className="border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em]"
                              onClick={() =>
                                publishImport({
                                  listingId: listing.id,
                                  url: listing.sourceUrl || undefined,
                                })
                              }
                              disabled={rowBusy || !listing.sourceUrl}
                            >
                              {rowBusy ? "Working…" : "Refresh"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#b42318]"
                            onClick={() => deleteListing(listing)}
                            disabled={rowBusy}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="mt-3 border border-line bg-mist p-3">
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                            Update from external URL
                          </p>
                          <p className="mt-1 text-xs text-ink-soft">
                            Paste a Ray White / office / homes link. This
                            refreshes photos and details on{" "}
                            <strong>/{listing.slug}</strong> without creating a
                            duplicate page.
                          </p>
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <input
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              placeholder="https://www.raywhite.co.nz/..."
                              className="flex-1 border border-line bg-paper px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              className="btn btn-primary !px-3 !py-2 text-xs"
                              disabled={rowBusy || !editUrl.trim()}
                              onClick={() =>
                                publishImport({
                                  listingId: listing.id,
                                  url: editUrl,
                                })
                              }
                            >
                              {rowBusy ? "Updating…" : "Update listing"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary !px-3 !py-2 text-xs"
                              onClick={() => {
                                setEditingId(null);
                                setEditUrl("");
                              }}
                              disabled={rowBusy}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}

        {tab === "leads" ? (
          <div
            role="tabpanel"
            id="admin-panel-leads"
            aria-labelledby="admin-tab-leads"
          >
            <div className="border border-line bg-paper p-6">
              <p className="eyebrow">Enquiries</p>
              <h2 className="display mt-2 text-3xl">Appraisal leads</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Latest appraisal form submissions.
              </p>
              <ul className="mt-6 divide-y divide-line border border-line">
                {leads.length === 0 ? (
                  <li className="px-4 py-6 text-sm text-ink-soft">
                    No leads yet.
                  </li>
                ) : null}
                {leads.map((lead) => (
                  <li key={lead.id} className="px-4 py-4 text-sm">
                    <p className="font-medium">
                      {lead.name} ·{" "}
                      <a
                        href={`mailto:${lead.email}`}
                        className="underline"
                      >
                        {lead.email}
                      </a>
                    </p>
                    <p className="mt-1 text-ink-soft">{lead.address}</p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(lead.createdAt).toLocaleString("en-NZ")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
