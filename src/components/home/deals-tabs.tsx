"use client";

import * as React from "react";
import { Carousel, Tab, TabList, TabPanel, Tabs } from "@/components/ui";
import { PackageCard } from "@/components/packages/package-card";
import { readViewed } from "@/lib/recently-viewed";
import type { Package } from "@/lib/types";

const BUDGET = 25000;
const offPct = (p: Package) => (p.listPrice ? (1 - p.price / p.listPrice) * 100 : 0);

/* Hydration-safe read of the visitor's recently viewed packages (empty on the server). */
const noop = () => () => {};
function useViewed() {
  // A string snapshot compares by value, so re-reading storage each render is stable.
  const raw = React.useSyncExternalStore(noop, () => JSON.stringify(readViewed()), () => "[]");
  return React.useMemo(() => JSON.parse(raw) as ReturnType<typeof readViewed>, [raw]);
}

function Row({ label, items, note }: { label: string; items: Package[]; note?: string }) {
  if (items.length === 0) return <p className="rounded-lg border border-dashed border-line bg-paper p-6 text-center text-ink-soft">Nothing here right now. Check back soon.</p>;
  return (
    <>
      {note && <p className="mb-3 text-sm text-ink-soft">{note}</p>}
      <Carousel label={label}>
        {items.map((p, i) => (
          <li key={p.id} className="w-[82vw] shrink-0 snap-start sm:w-[45vw] lg:w-[calc((100%-3rem)/4)]">
            <PackageCard p={p} priority={i < 2} />
          </li>
        ))}
      </Carousel>
    </>
  );
}

const Icon = ({ d }: { d: string }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="hidden shrink-0 sm:block"><path d={d} /></svg>;

export function DealsTabs({ packages }: { packages: Package[] }) {
  const viewed = useViewed();

  const trending = React.useMemo(() => [...packages].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8), [packages]);
  const deals = React.useMemo(() => packages.filter((p) => offPct(p) > 0).sort((a, b) => offPct(b) - offPct(a)).slice(0, 8), [packages]);
  const budget = React.useMemo(() => packages.filter((p) => p.price <= BUDGET).sort((a, b) => a.price - b.price).slice(0, 8), [packages]);

  // Score by shared themes and destinations with what they looked at; never re-suggest what they saw.
  const recommended = React.useMemo(() => {
    if (viewed.length === 0) return { items: [...packages].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount).slice(0, 8), personal: false };
    const seen = new Set(viewed.map((v) => v.slug));
    const themes = new Map<string, number>();
    viewed.forEach((v, i) => v.themes.forEach((t) => themes.set(t, (themes.get(t) ?? 0) + (viewed.length - i))));
    const dests = new Set(viewed.map((v) => v.destinationSlug));
    const scored = packages
      .filter((p) => !seen.has(p.slug))
      .map((p) => ({ p, score: p.themes.reduce((s, t) => s + (themes.get(t) ?? 0), 0) + (dests.has(p.destinationSlug) ? 4 : 0) + p.rating / 5 }))
      .filter((x) => x.score > 1)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p);
    return { items: scored.slice(0, 8), personal: scored.length > 0 };
  }, [packages, viewed]);

  return (
    <Tabs defaultValue="trending" className="space-y-5">
      <TabList label="Deal type" className="-mx-4 w-auto px-4 sm:mx-0 sm:w-fit sm:px-1">
        <Tab value="trending" className="inline-flex items-center gap-1.5"><Icon d="M3 17l6-6 4 4 8-8M15 7h6v6" /> Trending</Tab>
        <Tab value="deals" className="inline-flex items-center gap-1.5"><Icon d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9ZM7.5 7.5h.01" /> Best deals</Tab>
        <Tab value="budget" className="inline-flex items-center gap-1.5"><Icon d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> <span className="sm:hidden">Under ₹25k</span><span className="hidden sm:inline">Under ₹25,000</span></Tab>
        <Tab value="foryou" className="inline-flex items-center gap-1.5"><Icon d="M12 21s-7-4.4-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.6-9.5 9-9.5 9Z" /> <span className="sm:hidden">For you</span><span className="hidden sm:inline">Recommended for you</span></Tab>
      </TabList>
      <TabPanel value="trending"><Row label="Trending packages" items={trending} note="Most booked and reviewed by travelers right now." /></TabPanel>
      <TabPanel value="deals"><Row label="Best deals" items={deals} note="Biggest savings on our packages, sorted by discount." /></TabPanel>
      <TabPanel value="budget"><Row label={`Packages under ₹${BUDGET.toLocaleString("en-IN")}`} items={budget} note="Great trips that are easy on the wallet, per person before GST." /></TabPanel>
      <TabPanel value="foryou">
        <Row label="Recommended for you" items={recommended.items}
          note={recommended.personal ? "Picked from the trips you've been looking at." : "Our top-rated trips. Open a few packages and we'll tailor this to you."} />
      </TabPanel>
    </Tabs>
  );
}
