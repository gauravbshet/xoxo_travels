import type { ItineraryDay } from "@/lib/types";

/* Native <details>: works without JS, keyboard and screen-reader friendly.
   Day 1 open by default. A vertical line ties the days together. */
export function Itinerary({ days }: { days: ItineraryDay[] }) {
  return (
    <ol className="relative space-y-3 before:absolute before:bottom-6 before:left-[1.1rem] before:top-6 before:w-px before:bg-line">
      {days.map((d) => (
        <li key={d.day} className="relative">
          <details open={d.day === 1} className="group rounded-lg border border-line/70 bg-paper [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-3 pr-4">
              <span className="tabular relative z-10 grid size-9 shrink-0 place-items-center rounded-pill bg-sky-600 text-sm font-bold text-white">{d.day}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold uppercase tracking-[0.1em] text-ink-mute">Day {d.day}</span>
                <span className="block font-display text-base font-bold leading-snug text-ink">{d.title}</span>
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-ink-mute transition-transform duration-fast group-open:rotate-180">
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="space-y-3 px-4 pb-4 pl-[3.75rem]">
              <p className="text-[15px] leading-relaxed text-ink-soft">{d.body}</p>
              {(d.meals?.length || d.stay) && (
                <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {d.meals?.length ? <div className="flex gap-1.5"><dt className="text-ink-mute">Meals</dt><dd className="font-semibold text-ink">{d.meals.join(", ")}</dd></div> : null}
                  {d.stay && <div className="flex gap-1.5"><dt className="text-ink-mute">Stay</dt><dd className="font-semibold text-ink">{d.stay}</dd></div>}
                </dl>
              )}
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}
