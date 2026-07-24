import { AGENT_STATS } from "@/lib/agent-proof";
import { prisma } from "@/lib/db";

export type AgentStatLabels = {
  salesCountLabel: string;
  salesVolumeLabel: string;
  experienceLabel: string;
  rmaRating: string;
  rmaReviewCount: number;
  rmaReviewCountLabel: string;
  rmaRatingLabel: string;
};

/** Public marketing stats — editable in admin, with code fallbacks. */
export async function getAgentStats(): Promise<AgentStatLabels> {
  const settings = process.env.DATABASE_URL
    ? await prisma.siteSettings.findUnique({ where: { id: "default" } })
    : null;

  const salesCountLabel =
    settings?.salesCountLabel?.trim() || AGENT_STATS.salesCountLabel;
  const salesVolumeLabel =
    settings?.salesVolumeLabel?.trim() || AGENT_STATS.salesVolumeLabel;

  return {
    salesCountLabel,
    salesVolumeLabel,
    experienceLabel: AGENT_STATS.experienceLabel,
    rmaRating: AGENT_STATS.rmaRating,
    rmaReviewCount: AGENT_STATS.rmaReviewCount,
    rmaReviewCountLabel: AGENT_STATS.rmaReviewCountLabel,
    rmaRatingLabel: AGENT_STATS.rmaRatingLabel,
  };
}
