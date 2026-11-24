"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";
import { booking, priceFor } from "@/config/booking";
import { formatINR } from "@/lib/format";

/* Earliest bookable date, computed in the browser (the server prerenders
   without a clock). Empty string on the server snapshot. */
function useMinDate() {
  return React.useSyncExternalStore(
    () => () => {},
    () => { const d = new Date(); d.setDate(d.getDate() + booking.minLeadDays); return d.toISOString().slice(0, 10); },
    () => "",
  );
}

/* Rendered twice on the page (inline on mobile, sticky aside on desktop; only
   one is ever displayed). useId keeps element ids unique; only the `anchor`
   copy carries id="book", the mobile bar's jump target. */
export function BookingBox({ slug, price, listPrice, nights, days, className, anchor }: {
  slug: string; price: number; listPrice: number | null; nights: number; days: number; className?: string; anchor?: boolean;
}) {
  const uid = React.useId();
  const ids = { heading: `${uid}-h`, date: `${uid}-date`, pax: `${uid}-pax`, error: `${uid}-err` };
  const router = useRouter();
  const minDate = useMinDate();
  const [date, setDate] = React.useState("");
  const [pax, setPax] = React.useState(2);
  const [error, setError] = React.useState("");
  const p = priceFor(price, pax);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return setError("Pick a travel date to continue.");
    if (minDate && date < minDate) return setError(`Choose a date at least ${booking.minLeadDays} days from today.`);
    setError("");
    router.push(`/checkout?package=${slug}&date=${date}&travelers=${pax}`);
  };

  return (
    <form id={anchor ? "book" : undefined} onSubmit={submit} noValidate className={cn("scroll-mt-24 rounded-xl border border-line/70 bg-paper p-5 shadow-card-hover", className)} aria-labelledby={ids.heading}>
      <h2 id={ids.heading} className="sr-only">Book this package</h2>
      <p className="text-sm text-ink-mute">Price per person</p>
      <p className="mt-0.5 flex items-baseline gap-2">
        <span className="tabular font-display text-3xl font-extrabold text-ink">{formatINR(price)}</span>
        {listPrice && <span className="tabular text-sm text-ink-mute line-through">{formatINR(listPrice)}</span>}
      </p>
      <p className="text-sm text-ink-soft">{nights} nights, {days} days · plus GST</p>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor={ids.date} className="block text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Travel date</label>
          <input
            id={ids.date} type="date" value={date} min={minDate || undefined}
            onChange={(e) => { setDate(e.target.value); setError(""); }}
            aria-invalid={!!error} aria-describedby={error ? ids.error : undefined}
            className="mt-1.5 h-12 w-full rounded-md border border-line bg-paper px-3.5 text-[15px] text-ink focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-[invalid=true]:border-coral-600"
          />
        </div>

        <div>
          <span id={ids.pax} className="block text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Travelers</span>
          <div className="mt-1.5 flex h-12 items-center justify-between rounded-md border border-line px-1.5" role="group" aria-labelledby={ids.pax}>
            <button type="button" onClick={() => setPax((n) => Math.max(1, n - 1))} disabled={pax <= 1} aria-label="Remove a traveler" className="grid size-9 place-items-center rounded-md text-xl font-bold text-ink hover:bg-cream-deep disabled:opacity-35">−</button>
            <output aria-live="polite" className="tabular text-[15px] font-semibold">{pax} {pax === 1 ? "traveler" : "travelers"}</output>
            <button type="button" onClick={() => setPax((n) => Math.min(booking.maxTravelers, n + 1))} disabled={pax >= booking.maxTravelers} aria-label="Add a traveler" className="grid size-9 place-items-center rounded-md text-xl font-bold text-ink hover:bg-cream-deep disabled:opacity-35">+</button>
          </div>
        </div>
      </div>

      <dl className="mt-5 space-y-1.5 border-t border-line/70 pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-ink-soft">{formatINR(price)} × {pax}</dt><dd className="tabular">{formatINR(p.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-soft">{booking.gstLabel}</dt><dd className="tabular">{formatINR(p.gst)}</dd></div>
        <div className="flex justify-between pt-1.5 text-base font-bold"><dt>Total</dt><dd className="tabular">{formatINR(p.total)}</dd></div>
      </dl>

      {error && <p id={ids.error} role="alert" className="mt-3 text-sm font-semibold text-coral-700">{error}</p>}
      <Button type="submit" size="lg" className="mt-4 w-full">Book now</Button>
      <p className="mt-3 text-center text-xs text-ink-mute">Free cancellation up to 30 days before departure</p>
    </form>
  );
}

/* Mobile: fixed bar with price + jump to the form. Hidden on desktop,
   where the box itself stays in view. */
export function MobileBookBar({ price }: { price: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  // Publish the bar's height so other fixed bits (compare tray) sit above it.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--bottom-bar", getComputedStyle(el).display === "none" ? "0px" : `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    window.addEventListener("resize", set);
    return () => { ro.disconnect(); window.removeEventListener("resize", set); root.style.removeProperty("--bottom-bar"); };
  }, []);
  return (
    <div ref={ref} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="leading-tight"><span className="tabular text-lg font-bold">{formatINR(price)}</span><span className="block text-xs text-ink-mute">per person, plus GST</span></p>
        <Button href="#book" size="md">Book now</Button>
      </div>
    </div>
  );
}
