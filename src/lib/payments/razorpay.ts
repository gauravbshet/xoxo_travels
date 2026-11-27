import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/* Razorpay over its REST API and HMAC signatures. No SDK dependency: the
   order call is one POST, and verification is node:crypto.

   Mode:
   - "razorpay": key id + secret are set (and aren't the .env.example placeholders).
   - "mock":     keys missing (development only), or live keys while running
                 `npm run dev` (unless RAZORPAY_ALLOW_LIVE_IN_DEV=true). A Pay / Fail screen stands in.
   In production without keys, paymentMode() throws. Never a fake payment in prod. */

const real = (v: string | undefined) => (v && v.trim() && !/x{6,}/i.test(v) ? v.trim() : undefined);

/* The key id is public (it is handed to the checkout popup), so either name works. */
const keyId = () => real(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) ?? real(process.env.RAZORPAY_KEY_ID);
const keySecret = () => real(process.env.RAZORPAY_KEY_SECRET);
export const webhookSecret = () => real(process.env.RAZORPAY_WEBHOOK_SECRET);

export type PaymentMode = "razorpay" | "mock";

let liveDevWarned = false;

export function paymentMode(): PaymentMode {
  const id = keyId();
  if (id && keySecret()) {
    // Safety: live keys never charge real money from `npm run dev` unless explicitly allowed.
    if (id.startsWith("rzp_live_") && process.env.NODE_ENV !== "production" && process.env.RAZORPAY_ALLOW_LIVE_IN_DEV !== "true") {
      if (!liveDevWarned) { console.warn("[payments] Live Razorpay keys found in development; using the test-payment screen. Set RAZORPAY_ALLOW_LIVE_IN_DEV=true to take real payments locally."); liveDevWarned = true; }
      return "mock";
    }
    return "razorpay";
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Razorpay keys are missing. Set RAZORPAY_KEY_ID (or NEXT_PUBLIC_RAZORPAY_KEY_ID) and RAZORPAY_KEY_SECRET.");
  }
  return "mock";
}

export function publicKeyId() {
  const id = keyId();
  if (!id) throw new Error("RAZORPAY_KEY_ID is not set.");
  return id;
}

/** Creates a Razorpay order. Amount in paise. */
export async function createOrder(input: { amount: number; receipt: string; notes?: Record<string, string> }): Promise<{ id: string; amount: number; currency: string }> {
  const id = keyId(), secret = keySecret();
  if (!id || !secret) throw new Error("Razorpay keys are missing.");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` },
    body: JSON.stringify({ amount: input.amount, currency: "INR", receipt: input.receipt, notes: input.notes ?? {} }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Razorpay order failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  const order = (await res.json()) as { id: string; amount: number; currency: string };
  return { id: order.id, amount: order.amount, currency: order.currency };
}

function safeEqualHex(expected: string, given: string) {
  const a = Buffer.from(expected, "utf8"), b = Buffer.from(given, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Checkout handler signature: HMAC-SHA256(order_id|payment_id, key secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const secret = keySecret();
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature: HMAC-SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = webhookSecret();
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Refunds a captured payment (amount in paise). Returns Razorpay's refund id. */
export async function createRefund(paymentId: string, amount: number, notes: Record<string, string>): Promise<{ id: string; status: string }> {
  const id = keyId(), secret = keySecret();
  if (!id || !secret) throw new Error("Razorpay keys are missing.");
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` },
    body: JSON.stringify({ amount, notes }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay refund failed (${res.status}): ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const r = (await res.json()) as { id: string; status: string };
  return { id: r.id, status: r.status };
}
