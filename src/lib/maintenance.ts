import "server-only";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { TAGS } from "@/lib/cache-tags";

/* Nightly housekeeping, run by /api/cron/maintenance (Vercel Cron).
   Safe to run any number of times: every step only moves rows forward.

   1. Unpaid bookings whose trip has started → cancelled. They could still be paid
      until then (the site already shows them as "expired" afterwards). A payment that
      somehow lands later is still caught by markPaid and flagged for refund.
   2. Paid bookings whose trip has ended → completed. */

const BATCH = 500;
const dayStart = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

export async function runMaintenance(now = new Date()) {
  if (!db) return { skipped: "no database" } as const;
  const today = dayStart(now);

  // 1. Unpaid and the start date has passed.
  const stale = await db.booking.findMany({
    where: {
      status: "pending",
      OR: [{ travelDate: { lt: today } }, { groupTrip: { startDate: { lt: today } } }],
    },
    select: { id: true },
    take: BATCH,
  });
  const cancelled = stale.length
    ? (await db.booking.updateMany({ where: { id: { in: stale.map((b) => b.id) }, status: "pending" }, data: { status: "cancelled" } })).count
    : 0;

  // 2. Paid and the trip has ended. Packages end travelDate + nights; group trips have an end date.
  const candidates = await db.booking.findMany({
    where: {
      status: "confirmed",
      OR: [{ travelDate: { lt: today } }, { groupTrip: { endDate: { lt: today } } }],
    },
    select: { id: true, travelDate: true, package: { select: { nights: true } }, groupTrip: { select: { endDate: true } } },
    take: BATCH,
  });
  const ended = candidates.filter((b) => {
    const end = b.groupTrip?.endDate ?? (b.travelDate && new Date(b.travelDate.getTime() + (b.package?.nights ?? 0) * 86_400_000));
    return end ? end < today : false;
  });
  const completed = ended.length
    ? (await db.booking.updateMany({ where: { id: { in: ended.map((b) => b.id) }, status: "confirmed" }, data: { status: "completed" } })).count
    : 0;

  if (cancelled || completed) revalidateTag(TAGS.groupTrips, "max");
  return { cancelled, completed, more: stale.length === BATCH || candidates.length === BATCH };
}
