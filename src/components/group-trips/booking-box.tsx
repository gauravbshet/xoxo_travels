"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";
import { WaitlistForm } from "./waitlist-form";
import { booking, priceFor } from "@/config/booking";
import { formatINR } from "@/lib/format";

type Props = { slug: string; price: number; seatsLeft: number; seatsTotal: number; closed: boolean; className?: string; anchor?: boolean };

/* Group-trip booking box. The date is fixed (the departure), so only the
   traveler count is chosen. Sold out shows the waitlist; closed shows a note. */
export function GroupBookingBox({ slug, price, seatsLeft, seatsTotal, closed, className, anchor }: Props) {
  const uid = React.useId();
  const router = useRouter();
  const maxPax = Math.max(1, Math.min(seatsLeft, booking.maxTravelers));
  const [pax, setPax] = React.useState(Math.min(2, maxPax));
  const p = priceFor(price, pax);
  const soldOut = seatsLeft === 0;
  const low = !soldOut && seatsLeft <= booking.lowSeatsThreshold;
  const pct = Math.round(((seatsTotal - seatsLeft) / seatsTotal) * 100);

  return (
    <div id={anchor ? "book" : undefined} className={cn("scroll-mt-24 rounded-xl border border-line/70 bg-paper p-5 shadow-card-hover", className)}>
      <p className="text-sm text-ink-mute">Price per person</p>
      <p className="mt-0.5"><span className="tabular font-display text-3xl font-extrabold text-ink">{formatINR(price)}</span></p>
      <p className="text-sm text-ink-soft">plus GST</p>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-pill bg-cream-deep" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% of seats booked`}>
          <div className={cn("h-full rounded-pill", soldOut ? "bg-ink-mute" : low ? "bg-coral-500" : "bg-leaf-500")} style={{ width: `${pct}%` }} />
        </div>
        <p className={cn("mt-1.5 text-sm font-semibold", soldOut ? "text-ink-soft" : low ? "text-coral-700" : "text-leaf-700")}>
          {soldOut ? "Sold out" : low ? `Only ${seatsLeft} ${seatsLeft === 1 ? "seat" : "seats"} left` : `${seatsLeft} of ${seatsTotal} seats left`}
        </p>
      </div>

      {soldOut ? (
        <div className="mt-5 border-t border-line/70 pt-5">
          <h2 className="font-display text-lg font-bold">Join the waitlist</h2>
          <p className="mb-4 mt-1 text-sm text-ink-soft">We email you if a seat opens.</p>
          <WaitlistForm slug={slug} />
        </div>
      ) : closed ? (
        <p className="mt-5 rounded-lg bg-cream-deep p-4 text-sm font-semibold text-ink-soft">Booking is closed for this departure. Check the other upcoming trips.</p>
      ) : (
        <>
          <div className="mt-5">
            <span id={`${uid}-pax`} className="block text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Travelers</span>
            <div className="mt-1.5 flex h-12 items-center justify-between rounded-md border border-line px-1.5" role="group" aria-labelledby={`${uid}-pax`}>
              <button type="button" onClick={() => setPax((n) => Math.max(1, n - 1))} disabled={pax <= 1} aria-label="Remove a traveler" className="grid size-9 place-items-center rounded-md text-xl font-bold text-ink hover:bg-cream-deep disabled:opacity-35">−</button>
              <output aria-live="polite" className="tabular text-[15px] font-semibold">{pax} {pax === 1 ? "traveler" : "travelers"}</output>
              <button type="button" onClick={() => setPax((n) => Math.min(maxPax, n + 1))} disabled={pax >= maxPax} aria-label="Add a traveler" className="grid size-9 place-items-center rounded-md text-xl font-bold text-ink hover:bg-cream-deep disabled:opacity-35">+</button>
            </div>
          </div>
          <dl className="mt-5 space-y-1.5 border-t border-line/70 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">{formatINR(price)} × {pax}</dt><dd className="tabular">{formatINR(p.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">{booking.gstLabel}</dt><dd className="tabular">{formatINR(p.gst)}</dd></div>
            <div className="flex justify-between pt-1.5 text-base font-bold"><dt>Total</dt><dd className="tabular">{formatINR(p.total)}</dd></div>
          </dl>
          <Button size="lg" className="mt-4 w-full" onClick={() => router.push(`/checkout?trip=${slug}&travelers=${pax}`)}>Reserve {pax === 1 ? "seat" : "seats"}</Button>
          <p className="mt-3 text-center text-xs text-ink-mute">Free cancellation up to 30 days before departure</p>
        </>
      )}
    </div>
  );
}

/* Mobile: fixed bar with the price and a jump to the box. Hidden on desktop. */
export function GroupMobileBar({ price, soldOut, closed }: { price: number; soldOut: boolean; closed: boolean }) {
  if (closed && !soldOut) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="leading-tight"><span className="tabular text-lg font-bold">{formatINR(price)}</span><span className="block text-xs text-ink-mute">per person, plus GST</span></p>
        <Button href="#book" size="md">{soldOut ? "Join waitlist" : "Reserve seat"}</Button>
      </div>
    </div>
  );
}
