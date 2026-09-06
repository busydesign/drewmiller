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
      // Legacy / mistaken nav path
      {
        source: "/sales-map",
        destination: "/map",
        permanent: true,
      },
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
      // Old Squarespace listing slugs → sold page
      { source: "/511-ahuroa-road-puhoi", destination: "/sold", permanent: true },
      { source: "/25-jackson-way-stillwater", destination: "/sold", permanent: true },
      { source: "/227-mallard-place-unsworthheights", destination: "/sold", permanent: true },
      { source: "/35-matakana-valley-road-matakana", destination: "/sold", permanent: true },
      { source: "/3sandiacreway", destination: "/sold", permanent: true },
      { source: "/135-lancaster-road", destination: "/sold", permanent: true },
      { source: "/135-wiseley-road-west-harbour", destination: "/sold", permanent: true },
      { source: "/91-harris-drive-millwater", destination: "/sold", permanent: true },
      { source: "/41-princes-street-", destination: "/sold", permanent: true },
      { source: "/13e-teal-crescent-", destination: "/sold", permanent: true },
      { source: "/12-kenmure-avenue-forrest-hill", destination: "/sold", permanent: true },
      { source: "/48a-seacliffe-avenue-belmont", destination: "/sold", permanent: true },
      { source: "/119-bowman-road-forrest-hill", destination: "/sold", permanent: true },
      { source: "/5-buccaneer-court", destination: "/sold", permanent: true },
      { source: "/20-mays-street-devonport", destination: "/sold", permanent: true },
      { source: "/e6-18-oteha-valley-road-albany", destination: "/sold", permanent: true },
      { source: "/17-ceramco-", destination: "/sold", permanent: true },
      { source: "/for", destination: "/sold", permanent: true },
      // Old blog tags/categories → blog index
      { source: "/blog/tag/property", destination: "/blog", permanent: true },
      { source: "/blog/tag/Auckland", destination: "/blog", permanent: true },
      { source: "/blog/tag/investment", destination: "/blog", permanent: true },
      { source: "/blog/category/property", destination: "/blog", permanent: true },
      // Old testimonial pages → homepage
      { source: "/testimonials-1/2019/10/31/59-taurus-crescent-beach-haven-caitlin-and-mike-borgfeldt", destination: "/", permanent: true },
      { source: "/testimonials-1/2019/10/31/28-english-oak-drive-the-oaks-albany-paul-and-barbara-davidson", destination: "/", permanent: true },
      { source: "/testimonials-1/2018/1/15/lou-matt-vitali", destination: "/", permanent: true },
      { source: "/testimonials-1/2018/1/15/helen-rob-sutherland", destination: "/", permanent: true },
      // Squarespace home/misc pages
      { source: "/home", destination: "/", permanent: true },
      { source: "/home/", destination: "/", permanent: true },
      { source: "/newlettersignup", destination: "/", permanent: true },
      { source: "/takapuna-devonport", destination: "/about", permanent: true },
    ];
  },
};

export default nextConfig;
