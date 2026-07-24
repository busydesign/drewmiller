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
      // Unit-number slugs that used "/" and 404'd as nested paths
      {
        source: "/1/22-margaret-place-milford",
        destination: "/1-22-margaret-place-milford",
        permanent: true,
      },
      {
        source: "/12/30newhaventerrace",
        destination: "/2-30-newhaven-terrace-mairangi-bay",
        permanent: true,
      },
      {
        source: "/14/80eastcoastroadmilford",
        destination: "/14-80-east-coast-road-milford",
        permanent: true,
      },
      {
        source: "/1/6-nimsted-avenue-oteha",
        destination: "/1-6-nimstedt-avenue-oteha",
        permanent: true,
      },
      {
        source: "/1/82-stott-avenue-birkdale",
        destination: "/1-82-stott-avenue-birkdale",
        permanent: true,
      },
      {
        source: "/2/123lynnroad",
        destination: "/2-123-lynn-road-bayview",
        permanent: true,
      },
      {
        source: "/2/4-nimstedt-avenue-oteha/albany-1",
        destination: "/2-4-nimstedt-avenue-oteha-albany",
        permanent: true,
      },
      {
        source: "/6/4glenhavenplaceteatatupeninsula",
        destination: "/6-4-glen-haven-place-te-atatu-peninsula",
        permanent: true,
      },
      {
        source: "/6/82-east-coast-road-milford",
        destination: "/6-82-east-coast-road-milford",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
