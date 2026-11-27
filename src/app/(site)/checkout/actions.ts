"use server";

import { randomInt } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { checkCoupon, parseRef, resolveItem, takenSeats } from "@/lib/checkout";
import { booking, priceFor } from "@/config/booking";
import { limit } from "@/lib/rate-limit";

/* Every action re-reads price, seats and coupon on the server. Nothing the
   browser sends about money is trusted. */

const refSchema = z.object({
  kind: z.enum(["package", "trip"]),
  slug: z.string(),
  date: z.string().optional(),
  travelers: z.number().int().min(1).max(booking.maxTravelers),
});

function toRef(r: z.infer<typeof refSchema>) {
  return parseRef(r.kind === "package" ? { package: r.slug, date: r.date, travelers: r.travelers } : { trip: r.slug, travelers: r.travelers });
}

export type CouponState = { ok: true; code: string; title: string; discount: number } | { ok: false; message: string };

export async function applyCoupon(input: unknown): Promise<CouponState> {
  const parsed = z.object({ ref: refSchema, code: z.string().max(40) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter a valid coupon code." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to apply a coupon." };
  { const l = await limit("coupon", user.id); if (l) return { ok: false, message: l }; }
  const ref = toRef(parsed.data.ref);
  if (!ref) return { ok: false, message: "Your booking details are incomplete. Go back and pick again." };
  const res = await resolveItem(ref);
  if (!res.ok) return { ok: false, message: res.message };
  const c = await checkCoupon(parsed.data.code, res.item);
  return c.ok ? { ok: true, code: c.code, title: c.title, discount: c.discount } : c;
}

const person = z.object({
  name: z.string().trim().min(2, "Enter each traveler's full name.").max(80, "Name is too long."),
  age: z.coerce.number({ error: "Enter each traveler's age." }).int().min(0, "Enter a valid age.").max(110, "Enter a valid age."),
});

const bookingSchema = z.object({
  ref: refSchema,
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,16}$/, "Enter a valid phone number."),
  travelers: z.array(person).min(1).max(booking.maxTravelers),
  coupon: z.string().max(40).optional(),
  // Optional extras. Missing or false means "not required".
  services: z.object({ visa: z.boolean().optional(), esim: z.boolean().optional(), flights: z.boolean().optional() }).optional(),
});

export type BookingState =
  | { ok: true; reference: string; total: number }
  | { ok: false; message: string };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const makeReference = () => `XO-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")}`;

class SeatsGone extends Error {}

/** Creates (or refreshes) a pending booking. Payment is attached in the next step. */
export async function createBooking(input: unknown): Promise<BookingState> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const data = parsed.data;

  if (!db) {
    if (process.env.NODE_ENV === "production") throw new Error("Checkout needs DATABASE_URL in production.");
    return { ok: false, message: "Connect DATABASE_URL to create bookings in development." };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to continue." };
  { const l = await limit("checkout", user.id); if (l) return { ok: false, message: l }; }

  const ref = toRef(data.ref);
  if (!ref) return { ok: false, message: "Your booking details are incomplete. Go back and pick again." };
  if (data.travelers.length !== ref.travelers) return { ok: false, message: `Add details for all ${ref.travelers} travelers.` };
  if (data.travelers[0].age < booking.leadMinAge) return { ok: false, message: `The lead traveler must be at least ${booking.leadMinAge}.` };

  const res = await resolveItem(ref);
  if (!res.ok) return { ok: false, message: res.message };
  const item = res.item;
  if (!item.dbId) return { ok: false, message: "This item is not in the database yet. Run the seed." };

  let discount = 0;
  let offerId: string | null = null;
  let couponCode: string | null = null;
  if (data.coupon?.trim()) {
    const c = await checkCoupon(data.coupon, item);
    if (!c.ok) return { ok: false, message: c.message };
    discount = c.discount; offerId = c.offerId; couponCode = c.code;
  }

  const price = priceFor(item.perPerson, item.travelers, discount);
  const paise = (n: number) => n * 100;
  const travelerDetails = {
    contact: { name: data.travelers[0].name, email: user.email, phone: data.phone },
    travelers: data.travelers,
    coupon: couponCode,
    // Held with the pending booking; copied onto the booking only when payment is confirmed.
    services: { visa: data.services?.visa === true, esim: data.services?.esim === true, flights: data.services?.flights === true },
  };
  const now = new Date();
  const cutoff = new Date(now.getTime() - booking.seatHoldMinutes * 60_000);
  const itemWhere = item.kind === "package"
    ? { packageId: item.dbId, travelDate: new Date(item.date) }
    : { groupTripId: item.dbId };

  try {
    const saved = await db.$transaction(async (tx) => {
      if (item.kind === "trip") {
        // Lock the trip row so two checkouts can't both take the last seats.
        await tx.$queryRaw`SELECT id FROM "GroupTrip" WHERE id = ${item.dbId} FOR UPDATE`;
      }
      // Re-submitting the same booking refreshes it instead of creating a duplicate.
      const existing = await tx.booking.findFirst({ where: { userId: user.id, status: "pending", createdAt: { gt: cutoff }, ...itemWhere }, select: { id: true, reference: true } });

      if (item.kind === "trip") {
        const taken = await takenSeats(tx, item.dbId!, existing?.id, now);
        const seatsTotal = (await tx.groupTrip.findUniqueOrThrow({ where: { id: item.dbId! }, select: { seatsTotal: true } })).seatsTotal;
        if (taken + item.travelers > seatsTotal) throw new SeatsGone();
      }

      const fields = {
        travelers: item.travelers,
        subtotal: paise(price.subtotal), discount: paise(price.discount), tax: paise(price.gst), total: paise(price.total),
        offerId, travelerDetails,
      };
      if (existing) {
        return tx.booking.update({ where: { id: existing.id }, data: { ...fields, createdAt: now }, select: { reference: true } });
      }
      let reference = makeReference();
      for (let i = 0; i < 5 && (await tx.booking.findUnique({ where: { reference }, select: { id: true } })); i++) reference = makeReference();
      return tx.booking.create({
        data: { ...fields, reference, userId: user.id, status: "pending", ...itemWhere, ...(item.kind === "trip" && { travelDate: new Date(item.date) }) },
        select: { reference: true },
      });
    });
    return { ok: true, reference: saved.reference, total: price.total };
  } catch (e) {
    if (e instanceof SeatsGone) return { ok: false, message: "Those seats were just taken. Lower the number of travelers or pick another trip." };
    throw e;
  }
}
