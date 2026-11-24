import Link from "next/link";
import { cn } from "@/lib/cn";
import { Badge, Photo } from "@/components/ui";
import { formatDateRange, formatDuration, formatINR } from "@/lib/format";
import { booking } from "@/config/booking";
import { tripStyleLabel } from "@/lib/data/group-trips";
import type { GroupTrip } from "@/lib/types";

export function GroupTripCard({ t, className }: { t: GroupTrip; className?: string }) {
  const soldOut = t.seatsLeft === 0;
  const low = !soldOut && t.seatsLeft <= booking.lowSeatsThreshold;
  const pct = Math.round(((t.seatsTotal - t.seatsLeft) / t.seatsTotal) * 100);
  const start = new Date(t.startDate);

  return (
    <article
      className={cn(
        "group relative flex h-full overflow-hidden rounded-lg border border-line/70 bg-paper shadow-card",
        "has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-sky-500",
        "transition-[transform,box-shadow] duration-base ease-out-soft hover:-translate-y-1 hover:shadow-card-hover motion-reduce:hover:translate-y-0",
        soldOut && "opacity-80",
        className,
      )}
    >
      {/* Date block, like a calendar leaf */}
      <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center border-r border-line/70 bg-cream-deep px-2 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wide text-coral-700">{start.toLocaleString("en-IN", { month: "short" })}</p>
        <p className="font-display tabular text-3xl font-extrabold leading-none text-ink">{start.getDate()}</p>
        <p className="mt-1 text-[11px] font-medium text-ink-mute">{start.toLocaleString("en-IN", { weekday: "short" })}</p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={`/group-trips/${t.slug}`} tabIndex={-1} aria-hidden="true" className="relative block h-28 overflow-hidden bg-cream-deep">
          <Photo src={t.image.src} alt={t.image.alt} fill sizes="(min-width: 1024px) 360px, 90vw"
            className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.05] motion-reduce:group-hover:scale-100" />
          <div className="absolute left-2 top-2 flex gap-1.5">
            <Badge tone="blue" className="bg-paper/95">{tripStyleLabel[t.style]}</Badge>
            {soldOut ? <Badge tone="neutral" className="bg-paper/95">Sold out</Badge>
              : low ? <Badge tone="coral" className="bg-coral-50/95">Only {t.seatsLeft} left</Badge>
              : <Badge tone="green" className="bg-leaf-50/95">{t.seatsLeft} seats left</Badge>}
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-3.5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-mute">{t.destinationName} · {formatDuration(t.nights, t.days)}</p>
          <h3 className="mt-0.5 text-base leading-snug">
            <Link href={`/group-trips/${t.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">{t.title}</Link>
          </h3>
          <p className="mt-1 text-sm text-ink-soft">{formatDateRange(t.startDate, t.endDate)} · with {t.leader}</p>

          <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-cream-deep" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% of seats booked`}>
            <div className={cn("h-full rounded-pill", soldOut ? "bg-ink-mute" : low ? "bg-coral-500" : "bg-leaf-500")} style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-auto flex items-end justify-between pt-3">
            <p className="leading-none"><span className="tabular text-lg font-bold">{formatINR(t.price)}</span><span className="text-xs text-ink-mute"> / person</span></p>
            <span className={cn("rounded-pill px-3 py-1.5 text-xs font-bold", soldOut ? "bg-cream-deep text-ink-mute" : "bg-sky-600 text-white")}>{soldOut ? "Join waitlist" : "Reserve seat"}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
