import { formatINR } from "@/lib/format";

type Day = { date: string; revenue: number; bookings: number };

const short = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/* One series, one hue: daily confirmed revenue for the last 30 days.
   Each column is a full-height hover/focus target with a tooltip; a table view
   sits behind a disclosure for screen readers and exact numbers. */
export function RevenueChart({ days }: { days: Day[] }) {
  const max = Math.max(1, ...days.map((d) => d.revenue));
  const total = days.reduce((a, d) => a + d.revenue, 0);
  const ticks = [max, max / 2, 0];
  return (
    <figure>
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-lg font-display font-bold text-ink">Revenue, last 30 days</span>
        <span className="text-sm text-ink-soft"><strong className="tabular text-ink">{formatINR(total)}</strong> confirmed</span>
      </figcaption>
      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-2" aria-hidden="true">
        <div className="flex h-44 flex-col justify-between text-right text-[11px] tabular text-ink-mute">
          {ticks.map((t, i) => <span key={i}>{t >= 1000 ? `₹${Math.round(t / 1000)}k` : formatINR(Math.round(t))}</span>)}
        </div>
        <div className="relative h-44 border-b border-l border-line">
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line/70" />
          <div className="absolute inset-0 flex items-end gap-[2px] px-[2px]">
            {days.map((d) => (
              <div key={d.date} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none focus-visible:bg-sky-50">
                <div className="w-full rounded-t-[4px] bg-sky-600 group-hover:bg-sky-700 group-focus-visible:bg-sky-700" style={{ height: `${d.revenue ? Math.max(2, (d.revenue / max) * 100) : 0}%` }} />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white shadow-card group-hover:block group-focus-visible:block">
                  <span className="font-semibold">{short(d.date)}</span> · {formatINR(d.revenue)} · {d.bookings} {d.bookings === 1 ? "booking" : "bookings"}
                </div>
              </div>
            ))}
          </div>
        </div>
        <span />
        <div className="flex justify-between text-[11px] text-ink-mute"><span>{short(days[0].date)}</span><span>{short(days[days.length - 1].date)}</span></div>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-sky-600">Show as table</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Confirmed revenue and bookings per day, last 30 days</caption>
            <thead><tr className="text-xs uppercase tracking-[0.08em] text-ink-soft"><th className="py-1">Date</th><th className="py-1 text-right">Revenue</th><th className="py-1 text-right">Bookings</th></tr></thead>
            <tbody>{days.filter((d) => d.bookings).map((d) => <tr key={d.date} className="border-t border-line/70"><td className="py-1">{short(d.date)}</td><td className="py-1 text-right tabular">{formatINR(d.revenue)}</td><td className="py-1 text-right tabular">{d.bookings}</td></tr>)}</tbody>
          </table>
          {days.every((d) => !d.bookings) && <p className="py-2 text-ink-soft">No confirmed bookings in this period.</p>}
        </div>
      </details>
    </figure>
  );
}
