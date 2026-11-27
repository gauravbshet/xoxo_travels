import { Section, SectionHeader } from "@/components/ui";
import { searchPackages } from "@/lib/data/packages";
import { DealsTabs } from "./deals-tabs";

/* Trending, best deals, budget picks and "for you", in one tabbed row.
   id="deals" is the target of the promo banner's "Explore deals" buttons. */
export async function FeaturedPackages() {
  const packages = await searchPackages();
  return (
    <Section id="deals" aria-labelledby="packages-heading" className="scroll-mt-20 pt-5 sm:pt-6 bg-[linear-gradient(180deg,var(--color-paper)_0%,var(--color-cream)_100%)]">
      <SectionHeader
        id="packages-heading"
        eyebrow="Hand-picked for you"
        title="Deals worth grabbing"
        blurb="Flights, stays and sightseeing bundled. Add up to three to compare side by side."
        action={{ label: "All packages", href: "/holidays" }}
      />
      <DealsTabs packages={packages} />
    </Section>
  );
}
