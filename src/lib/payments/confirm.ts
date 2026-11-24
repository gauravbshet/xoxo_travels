import "server-only";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { db } from "@/lib/db";
import { takenSeats } from "@/lib/checkout";
import { sendBookingConfirmation } from "@/lib/email/booking-confirmed";
import type { Prisma } from "@/generated/prisma/client";

export type ConfirmResult =
  | { status: "confirmed" | "already-confirmed"; reference: string }
  | { status: "seats-gone" | "needs-refund"; reference: string }
  | { status: "unknown-order" | "amount-mismatch" };

/**
 * Marks a payment captured and its booking confirmed. Called by the checkout
 * handler (after signature check), the webhook, and the dev mock. Idempotent:
 * the second caller gets "already-confirmed".
 *
 * Group trips: seats are re-checked under a row lock. If the hold expired and
 * the seats went to someone else, the booking is cancelled and flagged for a
 * refund instead of overselling.
 */
export async function markPaid(input: {
  orderId: string;
  paymentId: string;
  signature?: string | null;
  method?: string | null;
  /** Paise, from the webhook payload. Checked against what we charged. */
  amount?: number;
  raw?: Prisma.InputJsonValue;
}): Promise<ConfirmResult> {
  if (!db) throw new Error("Payments need DATABASE_URL.");

  let bookingId: string | null = null;
  let seatsChanged = false;
  const result: ConfirmResult = await db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { razorpayOrderId: input.orderId },
      include: { booking: { select: { id: true, reference: true, status: true, groupTripId: true, travelers: true, offerId: true, travelerDetails: true } } },
    });
    if (!payment) return { status: "unknown-order" as const };
    const b = payment.booking;
    bookingId = b.id;

    if (input.amount !== undefined && input.amount !== payment.amount) {
      console.error(`[payments] amount mismatch on ${input.orderId}: got ${input.amount}, expected ${payment.amount}`);
      return { status: "amount-mismatch" as const };
    }
    if (payment.status === "captured" && b.status === "confirmed") return { status: "already-confirmed" as const, reference: b.reference };

    const capture = {
      status: "captured" as const,
      razorpayPaymentId: input.paymentId,
      ...(input.signature && { razorpaySignature: input.signature }),
      ...(input.method && { method: input.method }),
      ...(input.raw !== undefined && { rawWebhook: input.raw }),
    };

    // Paid for a booking that is no longer pending (cancelled meanwhile): keep the money record, flag it.
    if (b.status !== "pending" && b.status !== "confirmed") {
      await tx.payment.update({ where: { id: payment.id }, data: capture });
      console.error(`[payments] ${b.reference} paid while ${b.status}; refund due`);
      return { status: "needs-refund" as const, reference: b.reference };
    }

    if (b.groupTripId && b.status === "pending") {
      await tx.$queryRaw`SELECT id FROM "GroupTrip" WHERE id = ${b.groupTripId} FOR UPDATE`;
      const trip = await tx.groupTrip.findUniqueOrThrow({ where: { id: b.groupTripId }, select: { seatsTotal: true } });
      const taken = await takenSeats(tx, b.groupTripId, b.id);
      if (taken + b.travelers > trip.seatsTotal) {
        await tx.payment.update({ where: { id: payment.id }, data: capture });
        await tx.booking.update({ where: { id: b.id }, data: { status: "cancelled", notes: "Paid after the seat hold expired and the seats were taken. Full refund due." } });
        console.error(`[payments] ${b.reference} paid but seats are gone; refund due`);
        return { status: "seats-gone" as const, reference: b.reference };
      }
    }

    await tx.payment.update({ where: { id: payment.id }, data: capture });
    // Extra-help requests count only from here on: copy the checkout choices onto the paid booking.
    const chosen = (b.travelerDetails as { services?: Partial<Record<"visa" | "esim" | "flights", boolean>> } | null)?.services ?? {};
    await tx.booking.update({
      where: { id: b.id },
      data: { status: "confirmed", visaAssistance: chosen.visa === true, esimRequired: chosen.esim === true, flightAssistance: chosen.flights === true },
    });
    if (b.offerId) await tx.offer.update({ where: { id: b.offerId }, data: { usedCount: { increment: 1 } } });
    if (b.groupTripId) seatsChanged = true;
    return { status: "confirmed" as const, reference: b.reference };
  });

  // Seat counts on public trip pages are cached; refresh them in the background.
  if (seatsChanged) revalidateTag(TAGS.groupTrips, "max");
  // Email after commit. Idempotent, so "already-confirmed" also retries a send that failed earlier.
  if (bookingId && (result.status === "confirmed" || result.status === "already-confirmed")) await sendBookingConfirmation(bookingId);
  return result;
}

/** Records a failed attempt. The booking stays pending so the traveler can retry. */
export async function markFailed(orderId: string, raw?: Prisma.InputJsonValue) {
  if (!db) throw new Error("Payments need DATABASE_URL.");
  await db.payment.updateMany({
    where: { razorpayOrderId: orderId, status: { notIn: ["captured", "refunded"] } },
    data: { status: "failed", ...(raw !== undefined && { rawWebhook: raw }) },
  });
}
