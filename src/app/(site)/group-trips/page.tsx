import type { Metadata } from "next";
import { pageMeta } from "@/lib/metadata";
import { Suspense } from "react";
import { EmptyState, FilterChips, FilterPanel, PageHeader, ResultsBar, Skeleton } from "@/components/ui";
import { GroupTripCard } from "@/components/group-trips/group-trip-card";
import { searchGroupTrips, tripStyleLabel } from "@/lib/data/group-trips";
import { getMonthOptions } from "@/lib/dates";
import type { TripStyle } from "@/lib/types";

export const metadata: Metadata = pageMeta({ title: "Group trips", description: "Fixed-date departures in small groups, led by people who know the place. Treks, backpacking, road trips and women-only trips.", path: "/group-trips" });

const STYLES = Object.keys(tripStyleLabel) as TripStyle[];
const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export default function GroupTripsPage({ searchParams }: PageProps<"/group-trips">) {
  return (
    <div className="container-x py-10 sm:py-14">
      <PageHeader eyebrow="Group trips" title="Upcoming departures" blurb="Join a small group on a fixed date. Seats are limited and the bar shows what's left." />
      <Suspense fallback={<Grid>{Array.from({ length: 6 }).map((_, i) => <li key={i}><Skeleton className="h-56 rounded-lg" /></li>)}</Grid>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/group-trips">["searchParams"] }) {
  const [sp, months] = await Promise.all([searchParams, getMonthOptions()]);
  const f = { destination: str(sp.destination), month: str(sp.month), style: STYLES.find((s) => s === sp.style) };
  const results = await searchGroupTrips(f);
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) params.set(k, v);

  return (
    <>
      <FilterPanel>
        <FilterChips label="Style" param="style" base="/group-trips" params={params} current={f.style}
          chips={[{ label: "All" }, ...STYLES.map((s) => ({ label: tripStyleLabel[s], value: s }))]} />
        <FilterChips label="Month" param="month" base="/group-trips" params={params} current={f.month}
          chips={[{ label: "Any" }, ...months.slice(0, 8).map((m) => ({ label: monthChip(m.label, months[0].label), value: m.value }))]} />
      </FilterPanel>
      <ResultsBar
        count={results.length} noun={["departure", "departures"]} query={f.destination}
        activeCount={[f.style, f.month].filter(Boolean).length}
        clearHref={f.destination ? `/group-trips?destination=${encodeURIComponent(f.destination)}` : "/group-trips"}
      />
      {results.length === 0 ? (
        <EmptyState title="No departures match" blurb="Try another month or style. New dates are added every week." action={{ label: "See all departures", href: "/group-trips" }} />
      ) : (
        <Grid>{results.map((t) => <li key={t.id}><GroupTripCard t={t} /></li>)}</Grid>
      )}
    </>
  );
}

/* "Dec", then "Jan '27" once the year changes, so months stay unambiguous. */
function monthChip(label: string, first: string) {
  const [name, year] = label.split(" ");
  return year === first.split(" ")[1] ? name.slice(0, 3) : `${name.slice(0, 3)} '${year.slice(2)}`;
}

function Grid({ children }: { children: React.ReactNode }) {
  return <ul className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</ul>;
}
