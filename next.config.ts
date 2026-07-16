import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.squarespace-cdn.com" },
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
};

export default nextConfig;
