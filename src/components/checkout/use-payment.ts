"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { mockPayment, reportPaymentFailed, startPayment, verifyPayment, type StartPaymentResult } from "@/app/(site)/checkout/payment-actions";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: "payment.failed", cb: (r: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance }
}

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = SCRIPT; s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export type MockOrder = Extract<StartPaymentResult, { ok: true }>;

/* The whole pay flow for one booking: start → Razorpay popup (or the dev mock)
   → verify on the server → go to the confirmation page. */
export function usePayment(reference: string) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [mock, setMock] = React.useState<MockOrder | null>(null);

  const finish = React.useCallback((r: { ok: true } | { ok: false; message: string }) => {
    setMock(null);
    if (r.ok) { router.push(`/checkout/confirmation?ref=${reference}`); return; }
    setBusy(false); setError(r.message);
  }, [router, reference]);

  const pay = async () => {
    setBusy(true); setError("");
    const order = await startPayment(reference);
    if (!order.ok) { setBusy(false); return setError(order.message); }
    if (order.mode === "mock") { setBusy(false); return setMock(order); }

    if (!(await loadRazorpay()) || !window.Razorpay) { setBusy(false); return setError("The payment window didn't load. Check your connection and try again."); }
    const rzp = new window.Razorpay({
      key: order.keyId, order_id: order.orderId, amount: order.amount, currency: "INR",
      name: "XOXO Travels", description: order.description, prefill: order.prefill,
      theme: { color: "#087f63" },
      handler: async (r: RazorpayResponse) => finish(await verifyPayment({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature })),
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on("payment.failed", (r) => {
      void reportPaymentFailed(order.orderId);
      setError(`${r.error?.description ?? "Payment failed."} Nothing was charged. Try again.`);
    });
    rzp.open();
  };

  const runMock = async (kind: "success" | "fail") => {
    if (!mock) return;
    setBusy(true);
    finish(await mockPayment({ orderId: mock.orderId, outcome: kind }));
  };

  return { pay, runMock, busy, error, mock };
}
