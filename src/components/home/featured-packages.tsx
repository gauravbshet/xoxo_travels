import { Carousel, Reveal, Section, SectionHeader } from "@/components/ui";
import { PackageCard } from "@/components/packages/package-card";
import { getFeaturedPackages } from "@/lib/data/packages";

export async function FeaturedPackages() {
  const packages = await getFeaturedPackages(8);
  return (
    <Section aria-labelledby="packages-heading" className="bg-paper">
      <SectionHeader
        id="packages-heading"
        eyebrow="Holiday packages"
        title="Trips people are booking this season"
        blurb="Flights, stays and sightseeing bundled. Add up to three to compare side by side."
        action={{ label: "All packages", href: "/holidays" }}
      />
      <Carousel label="Featured holiday packages">
        {packages.map((p, i) => (
          <Reveal as="li" key={p.id} delay={i * 60} className="w-[85vw] shrink-0 snap-start sm:w-[45vw] lg:w-[calc((100%-3rem)/4)]">
            <PackageCard p={p} priority={i < 2} />
          </Reveal>
        ))}
      </Carousel>
    </Section>
  );
}
