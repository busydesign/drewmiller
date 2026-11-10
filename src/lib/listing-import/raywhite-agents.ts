import { TEAM_SEED } from "@/lib/team";

const NAME_BY_MEMBER_ID = new Map(
  TEAM_SEED.filter((agent) => agent.rwMemberId != null).map(
    (agent) => [agent.rwMemberId as number, agent.name] as const
  )
);

export function rayWhiteAgentName(
  fullName?: string | null,
  memberId?: number | null
): string {
  const named = (fullName || "").replace(/\s+/g, " ").trim();
  if (named) return named;
  if (memberId != null) return NAME_BY_MEMBER_ID.get(memberId) || "";
  return "";
}

export function normalizeRayWhiteAgents(
  agents:
    | Array<{ fullName?: string | null; memberId?: number | null }>
    | undefined
): Array<{ fullName: string; memberId: number | null }> {
  return (agents || [])
    .map((agent) => {
      const memberId = agent.memberId ?? null;
      return {
        fullName: rayWhiteAgentName(agent.fullName, memberId),
        memberId,
      };
    })
    .filter((agent) => agent.fullName || agent.memberId != null);
}
