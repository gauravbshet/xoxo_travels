import type { Metadata } from "next";
import { pageMeta } from "@/lib/metadata";
import { Suspense } from "react";
import { CardSkeleton, EmptyState, FilterChips, FilterPanel, PageHeader, ResultsBar } from "@/components/ui";
import { PackageCard } from "@/components/packages/package-card";
import { searchPackages, type PackageFilters } from "@/lib/data/packages";
import type { Region, Theme } from "@/lib/types";

export const metadata: Metadata = pageMeta({ title: "Holiday packages", description: "Flights, stays and sightseeing bundled. Filter by place, theme or budget, compare side by side, and book in minutes.", path: "/holidays" });

const REGIONS: Region[] = ["domestic", "international"];
const THEMES: Theme[] = ["honeymoon", "family", "adventure", "beach", "luxury", "budget", "culture"];
const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export default function HolidaysPage({ searchParams }: PageProps<"/holidays">) {
  return (
    <div className="container-x py-10 sm:py-14">
      <PageHeader eyebrow="Holidays" title="Holiday packages" blurb="Everything bundled, nothing hidden. Filter by place, theme or budget." />
      <Suspense fallback={<Grid>{Array.from({ length: 8 }).map((_, i) => <li key={i}><CardSkeleton /></li>)}</Grid>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/holidays">["searchParams"] }) {
  const sp = await searchParams;
  const f: PackageFilters = {
    destination: str(sp.destination),
    region: REGIONS.find((r) => r === sp.region),
    theme: THEMES.find((t) => t === sp.theme),
    budget: str(sp.budget),
    duration: (["weekend", "short", "long"] as const).find((d) => d === sp.duration),
    sort: (["popular", "price-asc", "price-desc", "rating"] as const).find((s) => s === sp.sort),
  };
  const results = await searchPackages(f);

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) params.set(k, v);

  return (
    <>
      <FilterPanel>
        <FilterChips label="Region" param="region" base="/holidays" params={params} current={f.region}
          chips={[{ label: "All" }, { label: "India", value: "domestic" }, { label: "International", value: "international" }]} />
        <FilterChips label="Theme" param="theme" base="/holidays" params={params} current={f.theme}
          chips={[{ label: "Any" }, ...THEMES.map((t) => ({ label: t[0].toUpperCase() + t.slice(1), value: t }))]} />
        <FilterChips label="Length" param="duration" base="/holidays" params={params} current={f.duration}
          chips={[{ label: "Any" }, { label: "Weekend (≤3N)", value: "weekend" }, { label: "4–6 nights", value: "short" }, { label: "7+ nights", value: "long" }]} />
      </FilterPanel>

      <ResultsBar
        count={results.length} noun={["package", "packages"]} query={f.destination}
        activeCount={[f.region, f.theme, f.duration, f.budget].filter(Boolean).length}
        clearHref={f.destination ? `/holidays?destination=${encodeURIComponent(f.destination)}` : "/holidays"}
        sort={{ param: "sort", base: "/holidays", params, current: f.sort === "popular" ? undefined : f.sort,
          options: [{ label: "Popular" }, { label: "Price: low to high", value: "price-asc" }, { label: "Price: high to low", value: "price-desc" }, { label: "Top rated", value: "rating" }] }}
      />

      {results.length === 0 ? (
        <EmptyState title="No packages match these filters" blurb="Widen the budget or clear a filter to see more." action={{ label: "Clear all filters", href: "/holidays" }} />
      ) : (
        <Grid>{results.map((p, i) => <li key={p.id}><PackageCard p={p} priority={i < 4} layout="list" /></li>)}</Grid>
      )}
    </>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{children}</ul>;
}
