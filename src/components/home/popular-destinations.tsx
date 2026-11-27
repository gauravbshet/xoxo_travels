import { Carousel, Reveal, Section, SectionHeader, Tab, TabList, TabPanel, Tabs } from "@/components/ui";
import { DestinationCard } from "@/components/destinations/destination-card";
import { getPopularDestinations } from "@/lib/data/destinations";

export async function PopularDestinations() {
  const [domestic, international] = await Promise.all([
    getPopularDestinations("domestic"),
    getPopularDestinations("international"),
  ]);

  return (
    <Section aria-labelledby="popular-heading">
      <SectionHeader
        id="popular-heading"
        eyebrow="Where next"
        title="Popular destinations"
        blurb="Hand-picked places with packages ready to book, at home and abroad."
        action={{ label: "All destinations", href: "/destinations" }}
      />
      <Tabs defaultValue="domestic" className="space-y-6">
        <Reveal>
          <TabList label="Region" className="w-fit">
            <Tab value="domestic">India</Tab>
            <Tab value="international">International</Tab>
          </TabList>
        </Reveal>
        <TabPanel value="domestic">
          <Carousel label="Popular destinations in India">
            {domestic.map((d, i) => (
              <Reveal as="li" key={d.id} delay={i * 60} className="w-[72vw] shrink-0 snap-start sm:w-[40vw] lg:w-[calc((100%-3rem)/4)]">
                <DestinationCard d={d} priority={i < 2} />
              </Reveal>
            ))}
          </Carousel>
        </TabPanel>
        <TabPanel value="international">
          <Carousel label="Popular international destinations">
            {international.map((d, i) => (
              <Reveal as="li" key={d.id} delay={i * 60} className="w-[72vw] shrink-0 snap-start sm:w-[40vw] lg:w-[calc((100%-3rem)/4)]">
                <DestinationCard d={d} />
              </Reveal>
            ))}
          </Carousel>
        </TabPanel>
      </Tabs>
    </Section>
  );
}
