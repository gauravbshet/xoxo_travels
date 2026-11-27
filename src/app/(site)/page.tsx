import { Hero } from "@/components/home/hero";
import { pageMeta } from "@/lib/metadata";
import { siteUrl } from "@/lib/site-url";
import { site } from "@/config/site";
import { CategoryRow } from "@/components/home/category-row";
import { PromoBanner } from "@/components/home/promo-banner";
import { PopularDestinations } from "@/components/home/popular-destinations";
import { FeaturedPackages } from "@/components/home/featured-packages";
import { UpcomingGroupTrips } from "@/components/home/upcoming-group-trips";
import { Offers } from "@/components/home/offers";
import { TrustStats } from "@/components/home/trust-stats";
import { Testimonials } from "@/components/home/testimonials";
import { FindPartnerPromo } from "@/components/home/find-partner-promo";
import { CommunityGrid } from "@/components/home/community-grid";
import { VisaAndSupport } from "@/components/home/visa-support";

export const metadata = pageMeta({
  title: "XOXO Travels — Holiday packages, group trips & travel partners",
  description: "Holiday packages, fixed-date group trips and travelers heading your way. Domestic and international trips from ₹12,999, booked in minutes.",
  path: "/",
  absoluteTitle: true,
});

/* TravelAgency structured data for search results. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: site.name,
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  image: `${siteUrl}/opengraph-image`,
  telephone: site.phone,
  email: site.email,
  address: { "@type": "PostalAddress", addressLocality: "Mangaluru", addressRegion: "Karnataka", addressCountry: "IN" },
  priceRange: "₹₹",
  sameAs: [site.social.instagram, site.social.facebook, site.social.youtube],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero />
      <Offers />
      <PromoBanner />
      <CategoryRow />
      <FeaturedPackages />
      <PopularDestinations />
      <UpcomingGroupTrips />
      <TrustStats />
      <FindPartnerPromo />
      <Testimonials />
      <CommunityGrid />
      <VisaAndSupport />
    </>
  );
}
