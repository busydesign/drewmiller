import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { FloatingAppraisalButton } from "@/components/FloatingAppraisalButton";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { MetaPixel } from "@/components/MetaPixel";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

/** Render on demand so production builds do not need DATABASE_URL. */
export const dynamic = "force-dynamic";

/** Interim stand-in until licensed Universal Sans files are added. */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Drew Miller | Ray White Mairangi Bay — Elite North Shore Agent",
    template: "%s | Drew Miller",
  },
  description:
    "Ray White Elite agent Drew Miller — 175+ North Shore sales, $205M+, Top 100 NZ. Appraisals, sold history, and local market clarity.",
  openGraph: {
    type: "website",
    locale: "en_NZ",
    siteName: "Drew Miller",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-NZ" className={`${inter.variable} reveal-pending`}>
      <body className="antialiased">
        <noscript>
          <style>{`.reveal-pending main section,.reveal-pending [data-reveal],.reveal-pending [data-reveal-stagger]>*{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <FloatingAppraisalButton />
        <ScrollReveal />
        <MetaPixel />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
