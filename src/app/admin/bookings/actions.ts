"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/admin";
import { TAGS } from "@/lib/cache-tags";
import { createRefund } from "@/lib/payments/razorpay";
import { sendEmail } from "@/lib/email/send";
import { refundShare } from "@/config/booking";
import { formatINR } from "@/lib/format";

/**
 * Cancels a booking and refunds it.
 * - "policy": the cancellation slab for today's date; "full": 100%; "none": 0%.
 * - Also used to pay out a refund owed on an already-cancelled booking (e.g. paid after the seats were gone).
 * The captured payment is claimed first, so a double click can't refund twice; if Razorpay fails, the claim is undone.
 */
export async function cancelBooking(input: unknown): Promise<{ ok: true; refunded: number } | { ok: false; message: string }> {
  const admin = await assertAdmin();
  const parsed = z.object({ reference: z.string().regex(/^XO-[A-Z0-9]+$/), mode: z.enum(["policy", "full", "none"]) }).safeParse(input);
  if (!parsed.success || !db) return { ok: false, message: "Invalid request." };

  const b = await db.booking.findUnique({
    where: { reference: parsed.data.reference },
    select: { id: true, reference: true, status: true, total: true, travelDate: true, groupTripId: true, notes: true, travelerDetails: true,
      payments: { where: { status: "captured" }, orderBy: { updatedAt: "desc" }, take: 1, select: { id: true, razorpayPaymentId: true, amount: true, method: true } } },
  });
  if (!b) return { ok: false, message: "Booking not found." };
  const payment = b.payments[0];
  const today = new Date().toISOString().slice(0, 10);
  const stamp = `${today} by ${admin.email}`;

  // Unpaid: just cancel.
  if (!payment) {
    if (b.status !== "pending") return { ok: false, message: "Nothing to cancel or refund on this booking." };
    await db.booking.update({ where: { id: b.id }, data: { status: "cancelled", notes: append(b.notes, `Cancelled (unpaid) ${stamp}.`) } });
    return { ok: true, refunded: 0 };
  }
  if (b.status !== "confirmed" && b.status !== "cancelled") return { ok: false, message: `Can't refund a ${b.status} booking.` };

  const daysBefore = b.travelDate ? Math.floor((b.travelDate.getTime() - new Date(today).getTime()) / 86_400_000) : 0;
  const policy = refundShare(daysBefore);
  // A booking already cancelled with money held (seats were gone) is always refunded in full.
  const share = b.status === "cancelled" ? 1 : parsed.data.mode === "full" ? 1 : parsed.data.mode === "none" ? 0 : policy.share;
  const amount = Math.min(payment.amount, Math.round(payment.amount * share)); // paise

  if (amount === 0) {
    await db.booking.update({ where: { id: b.id }, data: { status: "cancelled", notes: append(b.notes, `Cancelled ${stamp}. No refund (${parsed.data.mode === "none" ? "admin choice" : policy.label}).`) } });
    await notify(b, 0);
    if (b.groupTripId) updateTag(TAGS.groupTrips);
    return { ok: true, refunded: 0 };
  }

  // Claim the payment so a second click can't refund it again.
  const claim = await db.payment.updateMany({ where: { id: payment.id, status: "captured" }, data: { status: "refunded" } });
  if (claim.count === 0) return { ok: false, message: "This payment is already being refunded." };

  let refundId: string;
  try {
    if (payment.method === "mock") {
      if (process.env.NODE_ENV === "production") throw new Error("Mock payments can't be refunded in production.");
      refundId = `mock_rfnd_${Date.now()}`;
    } else {
      if (!payment.razorpayPaymentId) throw new Error("No Razorpay payment id on record.");
      refundId = (await createRefund(payment.razorpayPaymentId, amount, { reference: b.reference })).id;
    }
  } catch (e) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "captured" } });
    const m = e instanceof Error ? e.message : "Refund failed.";
    await db.booking.update({ where: { id: b.id }, data: { notes: append(b.notes, `Refund attempt failed ${stamp}: ${m.slice(0, 120)}`) } });
    return { ok: false, message: `Refund failed: ${m}. Nothing was refunded; you can try again.` };
  }

  await db.booking.update({
    where: { id: b.id },
    data: { status: "refunded", notes: append(b.notes, `Refunded ${formatINR(amount / 100)} (${Math.round(share * 100)}%) ${stamp}. Refund id ${refundId}.`) },
  });
  await notify(b, amount);
  if (b.groupTripId) updateTag(TAGS.groupTrips);
  return { ok: true, refunded: amount / 100 };
}

const append = (notes: string | null, line: string) => (notes ? `${notes}\n${line}` : line);

async function notify(b: { reference: string; travelerDetails: unknown }, amountPaise: number) {
  const email = (b.travelerDetails as { contact?: { email?: string; name?: string } } | null)?.contact;
  if (!email?.email) return;
  const refund = amountPaise > 0 ? `A refund of ${formatINR(amountPaise / 100)} is on its way. Banks usually take 5 to 7 working days.` : "No refund applies under our cancellation policy.";
  const text = `Hi ${email.name || "there"},\n\nYour booking ${b.reference} has been cancelled. ${refund}\n\nQuestions? Reply to this email with your reference.\n\nXOXO Travels`;
  await sendEmail({ to: email.email, subject: `Booking ${b.reference} cancelled`, text, html: `<p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>` })
    .catch((e) => console.error("[email] cancellation notice failed:", e instanceof Error ? e.message : e));
}
