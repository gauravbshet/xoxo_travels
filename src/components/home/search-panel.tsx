"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button, Field, Input, Select, Tab, TabList, TabPanel, Tabs } from "@/components/ui";
import { popularDestinations } from "@/config/media";
import type { MonthOption } from "@/lib/dates";

type Geo = { status: "idle" | "locating" | "ready" | "denied"; lat?: number; lng?: number };

export function SearchPanel({ months, className }: { months: MonthOption[]; className?: string }) {
  const router = useRouter();
  const [geo, setGeo] = React.useState<Geo>({ status: "idle" });

  const go = (path: string, form: HTMLFormElement) => {
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(form)) if (typeof v === "string" && v) params.set(k, v);
    if (geo.status === "ready") { params.set("lat", String(geo.lat)); params.set("lng", String(geo.lng)); }
    router.push(`${path}?${params}`);
  };

  const locate = () => {
    if (!("geolocation" in navigator)) return setGeo({ status: "denied" });
    setGeo({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setGeo({ status: "ready", lat: +coords.latitude.toFixed(4), lng: +coords.longitude.toFixed(4) }),
      () => setGeo({ status: "denied" }),
      { timeout: 8000, maximumAge: 60_000 },
    );
  };

  return (
    <Tabs defaultValue="holidays" className={cn("boarding-pass", className)}>
      {/* Ticket stub: the tab strip */}
      <div className="boarding-pass__stub">
        <TabList label="What are you planning?" variant="ticket">
          <Tab value="holidays" variant="ticket"><PlaneIcon /> Holidays</Tab>
          <Tab value="group" variant="ticket"><GroupIcon /> Group trips</Tab>
          <Tab value="destinations" variant="ticket"><PinIcon /> <span className="sm:hidden">Places</span><span className="hidden sm:inline">Destinations</span></Tab>
          <Tab value="partner" variant="ticket" accent><SparkIcon /> <span className="sm:hidden">Partner</span><span className="hidden sm:inline">Find a partner</span></Tab>
        </TabList>
      </div>

      {/* Perforation: dashed tear with real notches cut out of both edges */}
      <div className="boarding-pass__tear" aria-hidden="true" />

      {/* Ticket body: the form */}
      <div className="boarding-pass__body">
        <TabPanel value="holidays">
          <form onSubmit={(e) => { e.preventDefault(); go("/holidays", e.currentTarget); }} className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-end">
            <Field label="Where to" htmlFor="h-dest" className="col-span-2 md:col-span-1">
              <Input id="h-dest" name="destination" list="dest-list" placeholder="Goa, Bali, Europe…" autoComplete="off" />
            </Field>
            <Field label="Travel month" htmlFor="h-month">
              <Select id="h-month" name="month" defaultValue="">
                <option value="">Any month</option>
                {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
            </Field>
            <Field label="Travelers" htmlFor="h-pax">
              <Select id="h-pax" name="travelers" defaultValue="2">
                {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} {n === 1 ? "traveler" : "travelers"}</option>)}
                <option value="7+">7 or more</option>
              </Select>
            </Field>
            <Field label="Budget / person" htmlFor="h-budget" className="col-span-2 md:col-span-1">
              <Select id="h-budget" name="budget" defaultValue="">
                <option value="">Any budget</option>
                <option value="0-25000">Under ₹25,000</option>
                <option value="25000-50000">₹25,000 – ₹50,000</option>
                <option value="50000-100000">₹50,000 – ₹1,00,000</option>
                <option value="100000-">Above ₹1,00,000</option>
              </Select>
            </Field>
            <Button type="submit" size="lg" className="col-span-2 w-full md:col-span-1 md:w-auto">Search holidays</Button>
          </form>
        </TabPanel>

        <TabPanel value="group">
          <form onSubmit={(e) => { e.preventDefault(); go("/group-trips", e.currentTarget); }} className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
            <Field label="Where to" htmlFor="g-dest" className="col-span-2 md:col-span-1">
              <Input id="g-dest" name="destination" list="dest-list" placeholder="Ladakh, Vietnam, Meghalaya…" autoComplete="off" />
            </Field>
            <Field label="Departure month" htmlFor="g-month">
              <Select id="g-month" name="month" defaultValue="">
                <option value="">Any month</option>
                {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
            </Field>
            <Field label="Trip style" htmlFor="g-style">
              <Select id="g-style" name="style" defaultValue="">
                <option value="">Any style</option>
                <option value="trek">Trek</option>
                <option value="backpacking">Backpacking</option>
                <option value="roadtrip">Road trip</option>
                <option value="women-only">Women only</option>
              </Select>
            </Field>
            <Button type="submit" size="lg" className="col-span-2 w-full md:col-span-1 md:w-auto">See departures</Button>
          </form>
        </TabPanel>

        <TabPanel value="destinations">
          <form onSubmit={(e) => { e.preventDefault(); go("/destinations", e.currentTarget); }} className="grid gap-4 md:grid-cols-[1.6fr_1fr_auto] md:items-end">
            <Field label="Search a place" htmlFor="d-q">
              <Input id="d-q" name="q" list="dest-list" placeholder="Try “beach”, “Kerala” or “Europe”" autoComplete="off" />
            </Field>
            <Field label="Region" htmlFor="d-region">
              <Select id="d-region" name="region" defaultValue="">
                <option value="">India and abroad</option>
                <option value="domestic">India</option>
                <option value="international">International</option>
              </Select>
            </Field>
            <Button type="submit" size="lg" className="w-full md:w-auto">Explore</Button>
          </form>
        </TabPanel>

        <TabPanel value="partner">
          <form onSubmit={(e) => { e.preventDefault(); go("/partners", e.currentTarget); }} className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
            <Field label="Going to" htmlFor="p-dest" className="col-span-2 md:col-span-1">
              <Input id="p-dest" name="destination" list="dest-list" placeholder="Thailand, Goa…" autoComplete="off" required />
            </Field>
            <Field label="From" htmlFor="p-from">
              <Input id="p-from" name="from" type="date" />
            </Field>
            <Field label="To" htmlFor="p-to">
              <Input id="p-to" name="to" type="date" />
            </Field>
            <Button type="submit" size="lg" variant="coral" className="col-span-2 w-full md:col-span-1 md:w-auto">Find travelers</Button>
            <div className="col-span-2 flex flex-wrap items-center gap-3 text-sm md:col-span-4">
              <button type="button" onClick={locate} disabled={geo.status === "locating"} className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 font-semibold text-ink-soft hover:border-sky-500 hover:text-sky-600 disabled:opacity-60">
                <PinIcon />
                {geo.status === "locating" ? "Finding you…" : geo.status === "ready" ? "Location set" : "Use my location"}
              </button>
              <p className="text-ink-mute">
                {geo.status === "ready" && "We'll match travelers within 200 km of you."}
                {geo.status === "denied" && "Allow location access to match travelers near you."}
                {(geo.status === "idle" || geo.status === "locating") && "Matches are travelers within 200 km of you, heading the same way."}
              </p>
            </div>
          </form>
        </TabPanel>
      </div>

      <datalist id="dest-list">
        {popularDestinations.map((d) => <option key={d} value={d} />)}
      </datalist>
    </Tabs>
  );
}

const ico = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true as const, className: "shrink-0" };
function PlaneIcon() { return <svg {...ico}><path d="M2 14l8-1 4 7 2-1-1-7 6-2a1.5 1.5 0 0 0 0-2.8L15 5l-5-3-2 1 3 5-7 2-2 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>; }
function GroupIcon() { return <svg {...ico}><circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" /><circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M3 19a6 6 0 0 1 12 0M15 18a4.5 4.5 0 0 1 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function PinIcon() { return <svg {...ico}><path d="M12 21s-6-5.3-6-11a6 6 0 1 1 12 0c0 5.7-6 11-6 11Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" /></svg>; }
function SparkIcon() { return <svg {...ico}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>; }
