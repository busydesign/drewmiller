import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    return (
      <section className="section" data-reveal-skip>
        <div className="shell max-w-md">
          <p className="eyebrow">Agent access</p>
          <h1 className="display mt-2 text-4xl">Live editing</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Sign in to manage blog posts and import listings from Ray White URLs.
          </p>
          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </div>
      </section>
    );
  }

  const [listings, leads, blogPosts, settings, agents] = await Promise.all([
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
        agentLinks: {
          orderBy: { sortOrder: "asc" },
          select: {
            isLead: true,
            agent: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.appraisalLead.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.contentPage.findMany({
      where: { kind: "BLOG" },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        coverImageUrl: true,
        published: true,
        publishedAt: true,
        updatedAt: true,
      },
    }),
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.agent.findMany({
      where: { published: true },
      orderBy: [{ isLead: "desc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        name: true,
        isLead: true,
        rwMemberId: true,
      },
    }),
  ]);

  return (
    <div data-reveal-skip>
      <AdminDashboard
        listings={listings.map((l) => ({
          id: l.id,
          slug: l.slug,
          address: l.address,
          suburb: l.suburb,
          status: l.status,
          published: l.published,
          sourceUrl: l.sourceUrl,
          importSource: l.importSource,
          coverImageUrl: l.coverImageUrl,
          updatedAt: l.updatedAt.toISOString(),
          agents: l.agentLinks.map((link) => ({
            id: link.agent.id,
            name: link.agent.name,
            isLead: link.isLead,
          })),
        }))}
        agents={agents}
        leads={leads.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        }))}
        blogPosts={blogPosts.map((post) => ({
          ...post,
          bodyHtml: null,
          bodyMarkdown: null,
          publishedAt: post.publishedAt?.toISOString() ?? null,
          updatedAt: post.updatedAt.toISOString(),
        }))}
        settings={settings}
      />
    </div>
  );
}
