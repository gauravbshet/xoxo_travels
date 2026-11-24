"use client";

import { cn } from "@/lib/cn";
import { Badge, Button } from "@/components/ui";
import { booking } from "@/config/booking";
import { formatINR } from "@/lib/format";
import { usePayment } from "./use-payment";

/* Dev-only stand-in for the Razorpay window, shown when keys aren't set. */
function MockBox({ total, busy, onPay, onFail, className }: { total: number; busy: boolean; onPay: () => void; onFail: () => void; className?: string }) {
  return (
    <div className={cn("rounded-lg border-2 border-dashed border-sun-500 bg-paper p-4 text-left", className)}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-soft">Test payment · development only</p>
      <p className="mt-1 text-sm text-ink-soft">Razorpay keys aren&apos;t set, so this stands in for the payment window. No money moves.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button onClick={onPay} disabled={busy}>Pay {formatINR(total)}</Button>
        <Button variant="outline" onClick={onFail} disabled={busy}>Fail payment</Button>
      </div>
    </div>
  );
}

/* Shown after checkout saves the booking. Success goes to the confirmation page. */
export function PayPanel({ reference, total, summary, isTrip, backHref }: { reference: string; total: number; summary: string; isTrip: boolean; backHref: string }) {
  const { pay, runMock, busy, error, mock } = usePayment(reference);
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-line/70 bg-paper p-6 text-center shadow-card sm:p-8">
      <Badge tone="yellow">Awaiting payment</Badge>
      <h1 className="mt-3 text-3xl">Booking saved</h1>
      <p className="mt-2 text-ink-soft">Your reference is</p>
      <p className="mt-1 font-display text-3xl font-extrabold tracking-wide text-ink tabular">{reference}</p>
      <p className="mt-4 text-ink-soft">{summary} · <span className="font-semibold text-ink">{formatINR(total)}</span></p>
      {isTrip && <p className="mt-3 text-sm text-ink-soft">Your seats are held for {booking.seatHoldMinutes} minutes once you start paying.</p>}

      {mock
        ? <MockBox className="mt-6" total={total} busy={busy} onPay={() => runMock("success")} onFail={() => runMock("fail")} />
        : <Button size="lg" className="mt-6 w-full" onClick={pay} disabled={busy}>{busy ? "Opening payment..." : `Pay ${formatINR(total)}`}</Button>}

      {error && <p role="alert" className="mt-3 text-sm font-semibold text-coral-700">{error}</p>}
      <Button href={backHref} variant="outline" className="mt-3 w-full">Back to the trip</Button>
      <p className="mt-3 text-xs text-ink-mute">Payments are processed securely by Razorpay. You can also pay later from My bookings.</p>
    </div>
  );
}

/* Compact version for the bookings list. */
export function PayNowButton({ reference, total }: { reference: string; total: number }) {
  const { pay, runMock, busy, error, mock } = usePayment(reference);
  return (
    <div className="w-full sm:w-auto">
      {mock
        ? <MockBox total={total} busy={busy} onPay={() => runMock("success")} onFail={() => runMock("fail")} />
        : <Button size="sm" onClick={pay} disabled={busy} className="w-full sm:w-auto">{busy ? "Opening..." : `Pay ${formatINR(total)}`}</Button>}
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-coral-700">{error}</p>}
    </div>
  );
}
