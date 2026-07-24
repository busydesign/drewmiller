"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AdminBlogManager,
  type BlogPostRow,
} from "@/components/admin/AdminBlogManager";

type ListingAgentRow = {
  id: string;
  name: string;
  isLead: boolean;
};

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
  agents: ListingAgentRow[];
};

type TeamAgentOption = {
  id: string;
  name: string;
  isLead: boolean;
  rwMemberId: number | null;
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
  agents: TeamAgentOption[];
  leads: LeadRow[];
  blogPosts: BlogPostRow[];
  settings: {
    siteName: string;
    rateMyAgentUrl: string;
  } | null;
};

function agentIdsFromPreview(
  preview: Record<string, unknown> | null,
  agents: TeamAgentOption[]
): string[] {
  const hints = (preview?.hints || {}) as {
    agents?: Array<{ fullName?: string; memberId?: number | null }>;
    agentName?: string | null;
    agentMemberId?: number | null;
  };
  const rows =
    Array.isArray(hints.agents) && hints.agents.length > 0
      ? hints.agents
      : hints.agentName || hints.agentMemberId != null
        ? [
            {
              fullName: hints.agentName || "",
              memberId: hints.agentMemberId ?? null,
            },
          ]
        : [];

  const matched = rows
    .map((row) => {
      if (row.memberId != null) {
        const byId = agents.find((a) => a.rwMemberId === row.memberId);
        if (byId) return byId.id;
      }
      if (row.fullName) {
        const byName = agents.find(
          (a) => a.name.toLowerCase() === row.fullName!.toLowerCase()
        );
        if (byName) return byName.id;
      }
      return null;
    })
    .filter((id): id is string => Boolean(id));

  if (matched.length > 0) return [...new Set(matched)];
  const lead = agents.find((a) => a.isLead);
  return lead ? [lead.id] : [];
}

type TabId = "blog" | "listings" | "leads";

const TABS: { id: TabId; label: string }[] = [
  { id: "blog", label: "Blog" },
  { id: "listings", label: "Listings" },
  { id: "leads", label: "Leads" },
];

export function AdminDashboard({
  listings,
  agents,
  leads,
  blogPosts,
  settings,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("blog");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [importAgentIds, setImportAgentIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FOR_SALE" | "SOLD">(
    "ALL"
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editAgentIds, setEditAgentIds] = useState<string[]>([]);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  function toggleAgentId(
    ids: string[],
    setIds: (next: string[]) => void,
    agentId: string
  ) {
    if (ids.includes(agentId)) {
      setIds(ids.filter((id) => id !== agentId));
      return;
    }
    setIds([...ids, agentId]);
  }

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
      setImportAgentIds(agentIdsFromPreview(data.preview, agents));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
      setPreview(null);
      setImportAgentIds([]);
    } finally {
      setBusy(false);
    }
  }

  async function publishImport(opts?: {
    listingId?: string;
    url?: string;
    agentIds?: string[];
  }) {
    const publishUrl = (opts?.url ?? url).trim();
    if (!publishUrl) return;

    if (opts?.listingId) setRowBusyId(opts.listingId);
    else setBusy(true);
    setMessage(null);

    const agentIds =
      opts?.agentIds ??
      (opts?.listingId ? editAgentIds : importAgentIds);

    try {
      const res = await fetch("/api/admin/listing-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: publishUrl,
          mode: "publish",
          listingId: opts?.listingId || undefined,
          agentIds: agentIds.length > 0 ? agentIds : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");
      const agentLabel = Array.isArray(data.agents)
        ? data.agents.map((a: { name: string }) => a.name).join(" · ")
        : "";
      setMessage(
        `${data.updated ? "Updated" : "Published"} /${data.slug} · ${data.images || 0} photos${
          agentLabel ? ` · ${agentLabel}` : ""
        }`
      );
      if (!opts?.listingId) {
        setPreview(null);
        setUrl("");
        setImportAgentIds([]);
      }
      setEditingId(null);
      setEditUrl("");
      setEditAgentIds([]);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
      setRowBusyId(null);
    }
  }

  async function saveListingAgents(listingId: string) {
    setRowBusyId(listingId);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentIds: editAgentIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update agents");
      const names = Array.isArray(data.agents)
        ? data.agents.map((a: { name: string }) => a.name).join(" · ")
        : "none";
      setMessage(`Agents updated · ${names}`);
      setEditingId(null);
      setEditAgentIds([]);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
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
    setEditAgentIds(
      listing.agents.length > 0
        ? listing.agents.map((a) => a.id)
        : agents.filter((a) => a.isLead).map((a) => a.id)
    );
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
                Best from rwmairangibay.co.nz or raywhite.co.nz. Preview pulls
                agents from Ray White — tick anyone missing before publish. Use
                Edit on a listing below to refresh a specific page or retag
                agents.
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
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Agents on this listing
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  First ticked agent is the lead. Order is top → bottom.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {agents.map((agent) => {
                    const checked = importAgentIds.includes(agent.id);
                    const lead =
                      checked && importAgentIds[0] === agent.id;
                    return (
                      <label
                        key={agent.id}
                        className={`flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm ${
                          checked
                            ? "border-ink bg-mist"
                            : "border-line bg-paper"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleAgentId(
                              importAgentIds,
                              setImportAgentIds,
                              agent.id
                            )
                          }
                        />
                        <span>
                          {agent.name}
                          {lead ? (
                            <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                              Lead
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
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
                    <p className="md:col-span-2">
                      <span className="font-bold">Ray White agents:</span>{" "}
                      {(() => {
                        const hints = (preview.hints || {}) as {
                          agents?: Array<{ fullName?: string }>;
                        };
                        const names = (hints.agents || [])
                          .map((a) => a.fullName)
                          .filter(Boolean);
                        return names.length > 0 ? names.join(" · ") : "—";
                      })()}
                    </p>
                  </div>
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
                          <p className="mt-1 text-sm text-ink-soft">
                            Agents:{" "}
                            {listing.agents.length > 0
                              ? listing.agents
                                  .map((a) =>
                                    a.isLead ? `${a.name} (lead)` : a.name
                                  )
                                  .join(" · ")
                              : "—"}
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
                        <div className="mt-3 space-y-4 border border-line bg-mist p-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                              Agents
                            </p>
                            <p className="mt-1 text-xs text-ink-soft">
                              First ticked agent is the lead.
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {agents.map((agent) => {
                                const checked = editAgentIds.includes(agent.id);
                                const lead =
                                  checked && editAgentIds[0] === agent.id;
                                return (
                                  <label
                                    key={agent.id}
                                    className={`flex cursor-pointer items-center gap-2 border bg-paper px-3 py-2 text-sm ${
                                      checked ? "border-ink" : "border-line"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() =>
                                        toggleAgentId(
                                          editAgentIds,
                                          setEditAgentIds,
                                          agent.id
                                        )
                                      }
                                    />
                                    <span>
                                      {agent.name}
                                      {lead ? (
                                        <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                                          Lead
                                        </span>
                                      ) : null}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary mt-3 !px-3 !py-2 text-xs"
                              disabled={rowBusy}
                              onClick={() => saveListingAgents(listing.id)}
                            >
                              {rowBusy ? "Saving…" : "Save agents"}
                            </button>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                              Update from external URL
                            </p>
                            <p className="mt-1 text-xs text-ink-soft">
                              Paste a Ray White / office / homes link. This
                              refreshes photos and details on{" "}
                              <strong>/{listing.slug}</strong> without creating a
                              duplicate page. Ticked agents above are applied
                              too.
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
                                    agentIds: editAgentIds,
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
                                  setEditAgentIds([]);
                                }}
                                disabled={rowBusy}
                              >
                                Cancel
                              </button>
                            </div>
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
