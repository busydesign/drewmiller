import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    return (
      <section className="section">
        <div className="shell max-w-md">
          <p className="eyebrow">Agent access</p>
          <h1 className="display mt-2 text-4xl">Live editing</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Sign in to import, refresh, or delete listings from Ray White URLs.
          </p>
          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </div>
      </section>
    );
  }

  const [listings, leads, settings] = await Promise.all([
    prisma.listing.findMany({
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        slug: true,
        address: true,
        suburb: true,
        status: true,
        published: true,
        sourceUrl: true,
        importSource: true,
        coverImageUrl: true,
        updatedAt: true,
      },
    }),
    prisma.appraisalLead.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <AdminDashboard
      listings={listings.map((l) => ({
        ...l,
        updatedAt: l.updatedAt.toISOString(),
      }))}
      leads={leads.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      }))}
      settings={settings}
    />
  );
}
