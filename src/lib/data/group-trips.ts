import { cacheLife, cacheTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { withDatabaseFallback } from "@/lib/db";
import { TRIPS } from "../../../prisma/seed-data";
import { monthBounds } from "@/lib/format";
import { toGroupTrip } from "./mappers";
import type { GroupTrip, GroupTripDetail, TripStyle } from "@/lib/types";
import { booking } from "@/config/booking";

export type GroupTripFilters = { destination?: string; month?: string; style?: TripStyle };

export const tripStyleLabel: Record<TripStyle, string> = {
  trek: "Trek", backpacking: "Backpacking", roadtrip: "Road trip", "women-only": "Women only",
};

const byDate = (a: GroupTrip, b: GroupTrip) => a.startDate.localeCompare(b.startDate);
const today = () => new Date().toISOString().slice(0, 10);

/* Seats booked = sum of travelers on confirmed bookings. */
async function fetchUpcoming(): Promise<GroupTrip[]> {
  return withDatabaseFallback(
    "group trips",
    async (client) => {
      const rows = await client.groupTrip.findMany({
        where: { active: true, startDate: { gte: new Date(today()) } },
        include: { destination: { select: { slug: true, name: true, region: true } }, bookings: { where: { status: { in: ["confirmed", "completed"] } }, select: { travelers: true } } },
        orderBy: { startDate: "asc" },
      });
      return rows.map((r) => toGroupTrip({ ...r, seatsBooked: r.bookings.reduce((a, b) => a + b.travelers, 0) }));
    },
    () => TRIPS.filter((t) => t.startDate >= today()),
  );
}

export async function getUpcomingGroupTrips(limit = 6): Promise<GroupTrip[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.groupTrips);
  const t = today();
  return (await fetchUpcoming()).filter((x) => x.featured && x.startDate >= t).sort(byDate).slice(0, limit);
}

export async function searchGroupTrips(f: GroupTripFilters = {}): Promise<GroupTrip[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.groupTrips);
  const t = today();
  const q = f.destination?.trim().toLowerCase();
  const m = f.month ? monthBounds(f.month) : null;
  return (await fetchUpcoming()).filter((x) => {
    if (x.startDate < t) return false;
    if (q && !(x.destinationName.toLowerCase().includes(q) || x.title.toLowerCase().includes(q))) return false;
    if (f.style && x.style !== f.style) return false;
    if (m) { const s = new Date(x.startDate); if (s < m.from || s > m.to) return false; }
    return true;
  }).sort(byDate);
}

export async function getGroupTripBySlug(slug: string): Promise<GroupTrip | null> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.groupTrips);
  return (await fetchUpcoming()).find((x) => x.slug === slug) ?? null;
}

/* Placeholder content per trip style. Edit in admin (phase 3e): in DB mode,
   GroupTrip.itinerary (JSON, GroupTripDetail shape) overrides these defaults. */
const STYLE_DAYS: Record<TripStyle, string[]> = {
  trek: ["Acclimatisation walk and briefing", "Trail day with packed lunch", "Higher camp and views", "Summit or pass day", "Rest and short local walk"],
  backpacking: ["Old town and street food walk", "Local market and a cooking session", "Viewpoint hike and sunset", "Free day with leader tips", "Village day trip"],
  roadtrip: ["Drive to the next stop with scenic halts", "Viewpoints and photo stops", "Village visit and local lunch", "Long drive day with a sunset stop", "Free morning, then onward"],
  "women-only": ["Welcome circle and a gentle local walk", "Guided day out with local women hosts", "Wellness and free time", "Local craft or cooking session", "Sunset gathering"],
};
const STYLE_INCLUDES: Record<TripStyle, string[]> = {
  trek: ["Trek leader and local guides", "Camps or homestays with meals on the trail", "Permits and entry fees", "First-aid kit and safety briefing"],
  backpacking: ["Trip leader throughout", "Hostel or guesthouse stays, shared rooms", "Daily breakfast and a few group dinners", "Local transport on the route"],
  roadtrip: ["Trip leader and driver", "Shared vehicle for the whole route", "Hotel or homestay stays", "Daily breakfast"],
  "women-only": ["Woman trip leader throughout", "Safe, vetted stays", "Daily breakfast and group dinners", "Local transport and activities"],
};

/** Generated defaults for a trip page. The admin editor starts from these when nothing is saved. */
export function buildTripDetail(t: GroupTrip): GroupTripDetail {
  const acts = STYLE_DAYS[t.style];
  const itinerary = [
    { day: 1, title: `Meet the group in ${t.destinationName}`, body: `Meet your leader ${t.leader} and the group, settle into your stay and go over the plan over dinner.`, meals: ["Dinner"], stay: t.destinationName },
    ...Array.from({ length: Math.max(0, t.days - 2) }, (_, i) => ({
      day: i + 2, title: acts[i % acts.length], body: `A group day in and around ${t.destinationName}. Your leader sets the pace and adjusts the plan for weather and the group.`, meals: ["Breakfast"], stay: t.destinationName,
    })),
    { day: t.days, title: "Breakfast and farewell", body: "Breakfast, check out and goodbyes. Your leader helps with onward travel.", meals: ["Breakfast"] },
  ];
  return {
    itinerary,
    inclusions: STYLE_INCLUDES[t.style],
    exclusions: ["Travel to and from the meeting point", "Meals not listed", "Personal expenses and tips", "Travel insurance"],
    meetingPoint: `${t.destinationName}. The exact point and time are on your booking voucher.`,
    leaderBio: `${t.leader} leads this trip. They plan the route, handle local contacts and keep the group on schedule and safe.`,
    goodToKnow: [
      "Groups are small and shared. Keep luggage light.",
      "Carry a government photo ID for check-in and permits.",
      "The plan can shift for weather or road conditions. Your leader explains any change.",
    ],
  };
}

/* The page's data, or null for a past, inactive or unknown trip.
   bookingClosed is computed here because the page is prerendered without a clock. */
export async function getGroupTripDetail(slug: string): Promise<{ trip: GroupTrip; detail: GroupTripDetail; bookingClosed: boolean } | null> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.groupTrips);
  const trip = await getGroupTripBySlug(slug);
  if (!trip) return null;
  let detail = buildTripDetail(trip);
  const stored = await withDatabaseFallback(
    "group trip itinerary",
    async (client) => (await client.groupTrip.findUnique({ where: { slug }, select: { itinerary: true } }))?.itinerary ?? null,
    () => null,
  );
  if (stored && typeof stored === "object" && !Array.isArray(stored)) detail = { ...detail, ...(stored as Partial<GroupTripDetail>) };
  const cutoff = new Date(today());
  cutoff.setDate(cutoff.getDate() + booking.minLeadDays);
  return { trip, detail, bookingClosed: trip.startDate < cutoff.toISOString().slice(0, 10) };
}

export async function getAllGroupTripSlugs(): Promise<string[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.groupTrips);
  return (await fetchUpcoming()).map((t) => t.slug);
}
