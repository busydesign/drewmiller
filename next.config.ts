import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.squarespace-cdn.com" },
      { protocol: "https", hostname: "static1.squarespace.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.homes.co.nz" },
      { protocol: "https", hostname: "trademe.tmcdn.co.nz" },
      { protocol: "https", hostname: "rwmairangibay.co.nz" },
      { protocol: "https", hostname: "cdn6.ep.dynamics.net" },
      { protocol: "https", hostname: "static.ratemyagent.co.nz" },
      { protocol: "https", hostname: "fastly.ratemyagent.co.nz" },
    ],
    unoptimized: true,
  },
  async redirects() {
    return [
      // Old Squarespace dated blog URLs → flat /blog/[slug]
      {
        source: "/blog/:year(\\d{4})/:month(\\d{1,2})/:day(\\d{1,2})/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      {
        source:
          "/blog/will-your-90s-house-renovations-cost-you-when-its-time-to-sellnbsp",
        destination:
          "/blog/will-your-90s-house-renovations-cost-you-when-its-time-to-sell",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
