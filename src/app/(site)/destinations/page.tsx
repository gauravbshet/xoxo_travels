import type { Metadata } from "next";
import { pageMeta } from "@/lib/metadata";
import { Suspense } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button, Skeleton } from "@/components/ui";
import { DestinationCard } from "@/components/destinations/destination-card";
import { searchDestinations } from "@/lib/data/destinations";
import type { Region } from "@/lib/types";

export const metadata: Metadata = pageMeta({ title: "Destinations", description: "Popular places in India and abroad, from Goa and Ladakh to Bali and Dubai, each with packages ready to book.", path: "/destinations" });

type Search = { q?: string; region?: string };

export default function DestinationsPage({ searchParams }: PageProps<"/destinations">) {
  return (
    <div className="container-x py-10 sm:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Explore</p>
        <h1 className="text-4xl sm:text-5xl">Destinations</h1>
        <p className="mt-3 text-ink-soft">Pick a place to see every package we run there.</p>
      </header>
      <Suspense fallback={<GridSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/destinations">["searchParams"] }) {
  const sp = (await searchParams) as Search;
  const region = sp.region === "domestic" || sp.region === "international" ? (sp.region as Region) : undefined;
  const q = sp.q?.toString();
  const results = await searchDestinations({ q, region });

  const filters: { label: string; value?: Region }[] = [
    { label: "All" }, { label: "India", value: "domestic" }, { label: "International", value: "international" },
  ];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by region">
        {filters.map((f) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (f.value) params.set("region", f.value);
          const active = region === f.value;
          return (
            <Link
              key={f.label}
              href={`/destinations${params.size ? `?${params}` : ""}`}
              aria-current={active ? "true" : undefined}
              className={cn("rounded-pill border px-4 py-2 text-sm font-semibold transition-colors duration-fast",
                active ? "border-sky-600 bg-sky-600 text-white" : "border-line bg-paper text-ink-soft hover:border-sky-500 hover:text-sky-600")}
            >
              {f.label}
            </Link>
          );
        })}
        {q && (
          <p className="ml-auto text-sm text-ink-soft">
            {results.length} {results.length === 1 ? "result" : "results"} for <strong className="text-ink">“{q}”</strong>
          </p>
        )}
      </div>

      {results.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-paper p-10 text-center">
          <h2 className="text-2xl">No places match “{q}”</h2>
          <p className="mt-2 text-ink-soft">Try a country, a state, or a word like “beach” or “trek”.</p>
          <Button href="/destinations" variant="outline" className="mt-6">Show all destinations</Button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {results.map((d, i) => (
            <li key={d.id}><DestinationCard d={d} priority={i < 4} /></li>
          ))}
        </ul>
      )}
    </>
  );
}

function GridSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading destinations">
      {Array.from({ length: 8 }).map((_, i) => <li key={i}><Skeleton className="aspect-[4/5] rounded-lg" /></li>)}
    </ul>
  );
}
