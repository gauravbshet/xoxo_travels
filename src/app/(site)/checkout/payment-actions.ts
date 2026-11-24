"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { takenSeats } from "@/lib/checkout";
import { createOrder, paymentMode, publicKeyId, verifyPaymentSignature } from "@/lib/payments/razorpay";
import { markFailed, markPaid, type ConfirmResult } from "@/lib/payments/confirm";

export type StartPaymentResult =
  | {
      ok: true;
      mode: "razorpay" | "mock";
      orderId: string;
      /** Paise */
      amount: number;
      keyId: string | null;
      description: string;
      prefill: { name: string; email: string; contact: string };
    }
  | { ok: false; message: string };

export type PaymentOutcome = { ok: true; reference: string } | { ok: false; message: string };

class PaymentStop extends Error {}

/** Opens a payment for a pending booking: re-holds seats, then creates (or reuses) an order. */
export async function startPayment(reference: unknown): Promise<StartPaymentResult> {
  const ref = z.string().regex(/^XO-[A-Z0-9]{6}$/).safeParse(reference);
  if (!ref.success) return { ok: false, message: "That booking reference is not valid." };
  if (!db) return { ok: false, message: "Connect DATABASE_URL to take payments." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to pay." };

  const mode = paymentMode(); // throws in production without keys
  const now = new Date();

  let bk;
  try {
    bk = await db.$transaction(async (tx) => {
      const b = await tx.booking.findUnique({
        where: { reference: ref.data },
        include: { package: { select: { title: true } }, groupTrip: { select: { title: true, seatsTotal: true } } },
      });
      if (!b || b.userId !== user.id) throw new PaymentStop("We couldn't find that booking.");
      if (b.status === "confirmed") throw new PaymentStop("This booking is already paid.");
      if (b.status !== "pending") throw new PaymentStop("This booking can no longer be paid.");
      if (b.groupTripId && b.groupTrip) {
        await tx.$queryRaw`SELECT id FROM "GroupTrip" WHERE id = ${b.groupTripId} FOR UPDATE`;
        const taken = await takenSeats(tx, b.groupTripId, b.id, now);
        if (taken + b.travelers > b.groupTrip.seatsTotal) throw new PaymentStop("Those seats were just taken. Start a new booking with fewer travelers.");
      }
      // Restart the seat hold so it covers the payment window.
      await tx.booking.update({ where: { id: b.id }, data: { createdAt: now } });
      const existing = await tx.payment.findFirst({ where: { bookingId: b.id, status: "created", amount: b.total }, orderBy: { createdAt: "desc" }, select: { razorpayOrderId: true } });
      return { id: b.id, reference: b.reference, total: b.total, title: b.package?.title ?? b.groupTrip?.title ?? "Trip", contact: b.travelerDetails as { contact?: { name?: string; phone?: string } } | null, existingOrder: existing?.razorpayOrderId ?? null };
    });
  } catch (e) {
    if (e instanceof PaymentStop) return { ok: false, message: e.message };
    throw e;
  }

  // Reuse an unpaid order of the right mode and amount; otherwise make a new one.
  let orderId = bk.existingOrder && (mode === "mock") === bk.existingOrder.startsWith("mock_") ? bk.existingOrder : null;
  if (!orderId) {
    orderId = mode === "razorpay"
      ? (await createOrder({ amount: bk.total, receipt: bk.reference, notes: { reference: bk.reference } })).id
      : `mock_order_${randomBytes(8).toString("hex")}`;
    await db.payment.create({ data: { bookingId: bk.id, razorpayOrderId: orderId, amount: bk.total, status: "created", method: mode === "mock" ? "mock" : null } });
  }

  return {
    ok: true, mode, orderId, amount: bk.total,
    keyId: mode === "razorpay" ? publicKeyId() : null,
    description: `${bk.title} · ${bk.reference}`,
    prefill: { name: bk.contact?.contact?.name ?? "", email: user.email.endsWith("@placeholder.invalid") ? "" : user.email, contact: bk.contact?.contact?.phone ?? "" },
  };
}

async function ownedOrder(orderId: string) {
  if (!db) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const p = await db.payment.findUnique({ where: { razorpayOrderId: orderId }, select: { booking: { select: { userId: true } } } });
  return p && p.booking.userId === user.id ? p : null;
}

function outcome(r: ConfirmResult): PaymentOutcome {
  switch (r.status) {
    case "confirmed":
    case "already-confirmed": return { ok: true, reference: r.reference };
    case "seats-gone": return { ok: false, message: `Payment received, but the seats were taken while you paid. Booking ${r.reference} is cancelled and your full refund is on its way.` };
    case "needs-refund": return { ok: false, message: `Payment received for ${r.reference}, which was already cancelled. Your full refund is on its way.` };
    default: return { ok: false, message: "We couldn't match this payment. If money left your account, contact support with your booking reference." };
  }
}

const orderIdSchema = z.string().min(6).max(64);

/** Razorpay checkout success handler. The signature proves the payment came from Razorpay. */
export async function verifyPayment(input: unknown): Promise<PaymentOutcome> {
  const parsed = z.object({ orderId: orderIdSchema, paymentId: z.string().min(6).max(64), signature: z.string().min(16).max(256) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Payment details were incomplete. Contact support if you were charged." };
  const { orderId, paymentId, signature } = parsed.data;
  if (!(await ownedOrder(orderId))) return { ok: false, message: "We couldn't find that payment." };
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    console.error(`[payments] bad signature for ${orderId}`);
    return { ok: false, message: "We couldn't verify this payment. If money left your account, contact support." };
  }
  return outcome(await markPaid({ orderId, paymentId, signature }));
}

/** Popup reported a failed attempt. The booking stays pending so the traveler can retry. */
export async function reportPaymentFailed(orderId: unknown): Promise<void> {
  const id = orderIdSchema.safeParse(orderId);
  if (id.success && (await ownedOrder(id.data))) await markFailed(id.data);
}

/** Development stand-in for the Razorpay popup. Refuses to run with real keys or in production. */
export async function mockPayment(input: unknown): Promise<PaymentOutcome> {
  if (process.env.NODE_ENV === "production" || paymentMode() !== "mock") return { ok: false, message: "Test payments are off." };
  const parsed = z.object({ orderId: z.string().startsWith("mock_order_"), outcome: z.enum(["success", "fail"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid test payment." };
  if (!(await ownedOrder(parsed.data.orderId))) return { ok: false, message: "We couldn't find that payment." };
  if (parsed.data.outcome === "fail") {
    await markFailed(parsed.data.orderId);
    return { ok: false, message: "Payment failed. Nothing was charged. Try again." };
  }
  return outcome(await markPaid({ orderId: parsed.data.orderId, paymentId: `mock_pay_${randomBytes(8).toString("hex")}`, method: "mock" }));
}
