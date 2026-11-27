import type { Metadata, Viewport } from "next";
import { bricolage, bricolageRupee, dmSans, dmSansRupee } from "@/lib/fonts";
import { siteUrl } from "@/lib/site-url";
import { ErrorListener } from "@/components/monitoring/error-listener";
import "./globals.css";

const description =
  "Holiday packages, fixed-date group trips and travelers heading your way. Domestic and international trips, booked in minutes with secure Razorpay checkout.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "XOXO Travels — Holiday packages, group trips & travel partners", template: "%s · XOXO Travels" },
  description,
  applicationName: "XOXO Travels",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  // Site-wide only. Canonical / og:url / og:title are per page (lib/metadata.ts).
  openGraph: { type: "website", siteName: "XOXO Travels", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a6b52",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${bricolage.variable} ${dmSans.variable} ${bricolageRupee.variable} ${dmSansRupee.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Marks JS as running before first paint; scroll reveals key off it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-full flex flex-col">{children}<ErrorListener /></body>
    </html>
  );
}
