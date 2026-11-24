import { Rail, Reveal, Section, SectionHeader } from "@/components/ui";
import { GroupTripCard } from "@/components/group-trips/group-trip-card";
import { getUpcomingGroupTrips } from "@/lib/data/group-trips";

export async function UpcomingGroupTrips() {
  const trips = await getUpcomingGroupTrips(6);
  return (
    <Section aria-labelledby="group-trips-heading">
      <SectionHeader
        id="group-trips-heading"
        eyebrow="Group trips"
        title="Fixed dates. New friends. Zero planning."
        blurb="Small groups led by someone who knows the place. Seats fill fast, so the bar shows what's left."
        action={{ label: "All departures", href: "/group-trips" }}
      />
      <Rail label="Upcoming group trips" gridClassName="md:grid-cols-2 xl:grid-cols-3">
        {trips.map((t, i) => (
          <Reveal as="li" key={t.id} delay={i * 60}><GroupTripCard t={t} /></Reveal>
        ))}
      </Rail>
    </Section>
  );
}
