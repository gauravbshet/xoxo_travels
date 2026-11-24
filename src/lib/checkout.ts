import "server-only";
import { withDatabaseFallback } from "@/lib/db";
import { OFFERS, PACKAGES, TRIPS } from "../../prisma/seed-data";
import { toGroupTrip, toOffer, toPackage } from "@/lib/data/mappers";
import { appliesToLabel, type Offer } from "@/lib/data/offers";
import { booking } from "@/config/booking";
import { formatINR } from "@/lib/format";
import type { PrismaClient } from "@/generated/prisma/client";
import type { GroupTrip, Package, Region } from "@/lib/types";

/* Checkout reads are never cached: price, seats and coupons must be current
   at the moment someone pays. */

export type CheckoutRef =
  | { kind: "package"; slug: string; date: string; travelers: number }
  | { kind: "trip"; slug: string; travelers: number };

export type CheckoutItem = {
  kind: "package" | "trip";
  slug: string;
  title: string;
  image: { src: string; alt: string };
  destinationName: string;
  region: Region;
  themes: string[];
  nights: number;
  days: number;
  /** Rupees per person */
  perPerson: number;
  travelers: number;
  /** ISO start date (chosen date for packages, departure for trips) */
  date: string;
  endDate: string | null;
  leader: string | null;
  /** DB id, or null in seed mode */
  dbId: string | null;
};

export type ResolveResult =
  | { ok: true; item: CheckoutItem; seatsLeft: number | null }
  | { ok: false; message: string; backHref: string };

const SLUG = /^[a-z0-9-]{1,120}$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Reads the booking box's query string. Returns null if it's not usable. */
export function parseRef(input: { package?: unknown; trip?: unknown; date?: unknown; travelers?: unknown }): CheckoutRef | null {
  const one = (v: unknown) => (Array.isArray(v) ? v[0] : v);
  const travelers = Number(one(input.travelers));
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > booking.maxTravelers) return null;
  const pkg = one(input.package), trip = one(input.trip), date = one(input.date);
  if (typeof pkg === "string" && SLUG.test(pkg) && typeof date === "string" && ISO.test(date)) return { kind: "package", slug: pkg, date, travelers };
  if (typeof trip === "string" && SLUG.test(trip)) return { kind: "trip", slug: trip, travelers };
  return null;
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export function earliestBookableDate(now = new Date()) {
  const d = new Date(isoDay(now));
  d.setDate(d.getDate() + booking.minLeadDays);
  return isoDay(d);
}

type BookingReader = Pick<PrismaClient, "booking">;

/** Seats taken on a trip: paid bookings plus pending ones still inside the hold window. */
export async function takenSeats(client: BookingReader, groupTripId: string, excludeBookingId?: string, now = new Date()) {
  const cutoff = new Date(now.getTime() - booking.seatHoldMinutes * 60_000);
  const r = await client.booking.aggregate({
    _sum: { travelers: true },
    where: {
      groupTripId,
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
      OR: [{ status: { in: ["confirmed", "completed"] } }, { status: "pending", createdAt: { gt: cutoff } }],
    },
  });
  return r._sum.travelers ?? 0;
}

const destSelect = { destination: { select: { slug: true, name: true, region: true } } } as const;

export async function resolveItem(ref: CheckoutRef, now = new Date()): Promise<ResolveResult> {
  const earliest = earliestBookableDate(now);

  if (ref.kind === "package") {
    const back = `/holidays/${ref.slug}`;
    const found = await withDatabaseFallback<{ pkg: Package; id: string | null } | null>(
      "checkout package",
      async (client) => {
        const row = await client.package.findFirst({ where: { slug: ref.slug, active: true }, include: destSelect });
        return row ? { pkg: toPackage(row), id: row.id } : null;
      },
      () => { const p = PACKAGES.find((x) => x.slug === ref.slug); return p ? { pkg: p, id: null } : null; },
    );
    if (!found) return { ok: false, message: "This package is no longer available.", backHref: "/holidays" };
    if (ref.date < earliest) return { ok: false, message: `Choose a travel date at least ${booking.minLeadDays} days from today.`, backHref: back };
    const p = found.pkg;
    return {
      ok: true, seatsLeft: null,
      item: {
        kind: "package", slug: p.slug, title: p.title, image: p.image, destinationName: p.destinationName, region: p.region,
        themes: p.themes, nights: p.nights, days: p.days, perPerson: p.price, travelers: ref.travelers,
        date: ref.date, endDate: null, leader: null, dbId: found.id,
      },
    };
  }

  const back = `/group-trips/${ref.slug}`;
  const found = await withDatabaseFallback<{ trip: GroupTrip; id: string | null } | null>(
    "checkout trip",
    async (client) => {
      const row = await client.groupTrip.findFirst({ where: { slug: ref.slug, active: true }, include: destSelect });
      if (!row) return null;
      const taken = await takenSeats(client, row.id, undefined, now);
      return { trip: toGroupTrip({ ...row, seatsBooked: taken }), id: row.id };
    },
    () => { const t = TRIPS.find((x) => x.slug === ref.slug); return t ? { trip: t, id: null } : null; },
  );
  if (!found) return { ok: false, message: "This trip is no longer available.", backHref: "/group-trips" };
  const t = found.trip;
  if (t.startDate < earliest) return { ok: false, message: "Booking is closed for this departure.", backHref: back };
  if (t.seatsLeft === 0) return { ok: false, message: "This trip is sold out. Join the waitlist on the trip page.", backHref: back };
  if (ref.travelers > t.seatsLeft) return { ok: false, message: `Only ${t.seatsLeft} ${t.seatsLeft === 1 ? "seat is" : "seats are"} left. Lower the number of travelers.`, backHref: back };
  return {
    ok: true, seatsLeft: t.seatsLeft,
    item: {
      kind: "trip", slug: t.slug, title: t.title, image: t.image, destinationName: t.destinationName, region: t.region,
      themes: [], nights: t.nights, days: t.days, perPerson: t.price, travelers: ref.travelers,
      date: t.startDate, endDate: t.endDate, leader: t.leader, dbId: found.id,
    },
  };
}

export type CouponResult =
  | { ok: true; code: string; title: string; discount: number; offerId: string | null }
  | { ok: false; message: string };

const CODE = /^[A-Z0-9]{3,32}$/;

function appliesTo(offer: Offer, item: CheckoutItem) {
  switch (offer.appliesTo) {
    case "all": return true;
    case "group-trips": return item.kind === "trip";
    case "domestic":
    case "international": return item.kind === "package" && item.region === offer.appliesTo;
    case "honeymoon": return item.kind === "package" && item.themes.includes("honeymoon");
    default: return false;
  }
}

/** Checks a coupon against the Offer table and returns the discount in rupees. One coupon per booking. */
export async function checkCoupon(rawCode: string, item: CheckoutItem, now = new Date()): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase();
  if (!CODE.test(code)) return { ok: false, message: "Enter a valid coupon code." };

  const found = await withDatabaseFallback(
    "coupon lookup",
    async (client) => {
      const o = await client.offer.findFirst({ where: { code, active: true, validFrom: { lte: now } } });
      if (o && o.usageLimit !== null && o.usedCount >= o.usageLimit) return null; // used up
      return o ? { offer: toOffer(o), id: o.id as string | null } : null;
    },
    () => { const o = OFFERS.find((x) => x.code === code); return o ? { offer: o, id: null } : null; },
  );
  const expired = "That code does not exist or has expired.";
  if (!found || found.offer.validTill < isoDay(now)) return { ok: false, message: expired };
  const { offer } = found;

  if (!appliesTo(offer, item)) return { ok: false, message: `This code works on ${appliesToLabel[offer.appliesTo].toLowerCase()} only.` };
  const subtotal = item.perPerson * item.travelers;
  if (offer.minSpend && subtotal < offer.minSpend) return { ok: false, message: `Add ${formatINR(offer.minSpend - subtotal)} more to use this code.` };

  let discount: number;
  if (offer.kind === "percent") {
    discount = Math.floor((subtotal * offer.value) / 100);
    if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
  } else {
    const perSeat = (booking.perSeatCoupons as readonly string[]).includes(offer.appliesTo);
    discount = offer.value * (perSeat ? item.travelers : 1);
  }
  discount = Math.max(0, Math.min(discount, subtotal));
  return { ok: true, code, title: offer.title, discount, offerId: found.id };
}
