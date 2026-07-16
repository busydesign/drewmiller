/** Public proof points for Drew Miller — sourced from Ray White + RateMyAgent. */

export const RAY_WHITE_PROFILE_URL =
  "https://www.raywhite.co.nz/drew-miller/real-estate-agent/dm211313241?type=selling";

export const RATE_MY_AGENT_URL =
  "https://www.ratemyagent.co.nz/real-estate-agent/drew-miller-au137/sales/overview";

export const AGENT_STATS = {
  salesCountLabel: "175+",
  salesVolumeLabel: "$205M+",
  experienceLabel: "10+ years",
  rmaRatingLabel: "5.0 · 140 reviews",
} as const;

/** Kept for later — not shown on home while RMA badges lead. */
export const ELITE_AWARDS = [
  { period: "2025/2026", titles: ["Elite Performer", "Premier Performer"] },
  { period: "2024/2025", titles: ["Elite Performer", "Premier Performer"] },
  { period: "2023/2024", titles: ["Premier Performer"] },
  { period: "2022/2023", titles: ["Premier Performer"] },
  { period: "2020/2021", titles: ["Elite Performer"] },
] as const;

/** Current-year Ray White Elite recognition mark. */
export const RAY_WHITE_ELITE_BADGE = {
  image: "/brand/ray-white-elite-2025-2026.png",
  alt: "Ray White Elite · 2025–2026",
  period: "2025–2026",
} as const;

/** Award badges shown on home / about. */
export const RMA_AWARD_BADGES = [
  {
    id: "top100-2026",
    title: "Top 100 Agent · NZ 2026",
    detail: "National Winner 2026 — among New Zealand’s Top 100 agents.",
    image: "/brand/rma/top100-nz-2026.png",
  },
  {
    id: "bayview-2026",
    title: "Agent of the Year · Bayview",
    detail: "Suburb Winner 2026 — Agent of the Year for Bayview.",
    image: "/brand/rma/bayview-agent-of-year-2026.png",
  },
  {
    id: "top20",
    title: "Top 20% Nationwide",
    detail: "Top 20% nationwide for customer satisfaction.",
    image: "/brand/rma/top20.svg",
  },
  {
    id: "trusted",
    title: "Trusted Agent",
    detail: "Reviews invited from every client — positive or negative.",
    image: "/brand/rma/trusted.svg",
  },
  {
    id: "price-expert",
    title: "Price Expert",
    detail: "Consistently meets client expectations on sale price.",
    image: "/brand/rma/price-expert.svg",
  },
] as const;

/** Curated client reviews (legacy site testimonials + RMA positioning). */
export const FEATURED_REVIEWS = [
  {
    quote:
      "Their sales pitch was compelling and vibrant, strong but not pushy… Shane and Drew backed the property, were honest about the price, stuck to that recommendation, and delivered all the way.",
    name: "Caitlin & Mike Borgfeldt",
    property: "59 Taurus Crescent, Beach Haven",
  },
  {
    quote:
      "From the moment we signed up they worked tirelessly to achieve the best result for us… Their communications and professional advice were always punctual and superb.",
    name: "Paul & Barbara Davidson",
    property: "28 English Oak Drive, Albany",
  },
  {
    quote:
      "We were so impressed by their professionalism and Sales and Marketing skills that we gave them the opportunity to list and market our house.",
    name: "Helen & Rob Sutherland",
    property: "North Shore sale",
  },
  {
    quote:
      "The ease at which this was managed I’ll be forever grateful. I will always look towards Drew as my first port of call when purchasing or selling.",
    name: "Richard Hannah",
    property: "Client review",
  },
] as const;

export const HERO_IMAGE = "/brand/hero-team.png";
