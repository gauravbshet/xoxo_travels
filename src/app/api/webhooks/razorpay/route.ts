import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyWebhookSignature, webhookSecret } from "@/lib/payments/razorpay";
import { markFailed, markPaid } from "@/lib/payments/confirm";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Razorpay → backup confirmation, for payments where the browser closed before
 * the checkout handler ran. Dashboard → Webhooks → https://<domain>/api/webhooks/razorpay,
 * events payment.captured, order.paid, payment.failed. Safe to receive twice.
 */
const paymentEntity = z.object({ id: z.string(), order_id: z.string().nullable().optional(), amount: z.number().int(), method: z.string().nullish() });
const eventSchema = z.object({
  event: z.string(),
  payload: z.object({ payment: z.object({ entity: paymentEntity }).optional() }).passthrough(),
});

export async function POST(req: Request) {
  if (!webhookSecret()) return NextResponse.json({ error: "RAZORPAY_WEBHOOK_SECRET not set" }, { status: 500 });
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const signature = req.headers.get("x-razorpay-signature");
  const body = await req.text();
  if (!signature || !verifyWebhookSignature(body, signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  let json: unknown;
  try { json = JSON.parse(body); } catch { return NextResponse.json({ error: "Malformed body" }, { status: 400 }); }
  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: true, ignored: true });

  const { event, payload } = parsed.data;
  const p = payload.payment?.entity;
  if (!p?.order_id) return NextResponse.json({ ok: true, ignored: true });
  const raw = json as Prisma.InputJsonValue;

  if (event === "payment.captured" || event === "order.paid") {
    const r = await markPaid({ orderId: p.order_id, paymentId: p.id, method: p.method ?? null, amount: p.amount, raw });
    // Unknown orders get 200 so Razorpay stops retrying something we'll never match; it's logged.
    if (r.status === "unknown-order") console.warn(`[payments] webhook for unknown order ${p.order_id}`);
    return NextResponse.json({ ok: true, status: r.status });
  }
  if (event === "payment.failed") {
    await markFailed(p.order_id, raw);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: true, ignored: true });
}
