import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { decodeHtmlEntities } from "../src/lib/listing-import/decode-html";
import { TEAM_SEED } from "../src/lib/team";

const prisma = new PrismaClient();
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function stripTags(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchBio(sourceUrl: string): Promise<{
  bioHtml: string | null;
  bioMarkdown: string | null;
  photoUrl: string | null;
  role: string | null;
}> {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const res = await fetch(sourceUrl, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html",
        Referer: "https://rwmairangibay.co.nz/",
      },
      cache: "no-store",
    });
    const html = await res.text();
    const m = html.match(
      /window\.INITIAL_STATE\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/i
    );
    if (!m?.[1]) return { bioHtml: null, bioMarkdown: null, photoUrl: null, role: null };
    const state = JSON.parse(m[1]) as {
      members?: { entities?: Record<string, {
        description?: string;
        imageHeadshot?: string;
        title?: string;
      }> };
    };
    const id = sourceUrl.match(/\/(\d+)(?:\?|$)/)?.[1];
    const member = id ? state.members?.entities?.[id] : null;
    const bioHtml = member?.description?.trim() || null;
    return {
      bioHtml,
      bioMarkdown: bioHtml ? stripTags(bioHtml) : null,
      photoUrl: member?.imageHeadshot || null,
      role: member?.title || null,
    };
  } catch {
    return { bioHtml: null, bioMarkdown: null, photoUrl: null, role: null };
  }
}

async function main() {
  for (const seed of TEAM_SEED) {
    const live = await fetchBio(seed.sourceUrl);
    const agent = await prisma.agent.upsert({
      where: { slug: seed.slug },
      create: {
        slug: seed.slug,
        name: seed.name,
        role: live.role || seed.role,
        email: seed.email,
        phone: seed.phone,
        photoUrl: live.photoUrl || seed.photoUrl,
        bioHtml: live.bioHtml,
        bioMarkdown: live.bioMarkdown,
        sourceUrl: seed.sourceUrl,
        rwMemberId: seed.rwMemberId,
        rwUsername: seed.rwUsername,
        isLead: seed.isLead,
        sortOrder: seed.sortOrder,
        published: true,
      },
      update: {
        name: seed.name,
        role: live.role || seed.role,
        email: seed.email,
        phone: seed.phone,
        photoUrl: live.photoUrl || seed.photoUrl,
        bioHtml: live.bioHtml ?? undefined,
        bioMarkdown: live.bioMarkdown ?? undefined,
        sourceUrl: seed.sourceUrl,
        rwMemberId: seed.rwMemberId,
        rwUsername: seed.rwUsername,
        isLead: seed.isLead,
        sortOrder: seed.sortOrder,
        published: true,
      },
    });
    console.log(`✓ ${agent.name}${agent.isLead ? " (lead)" : ""}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
