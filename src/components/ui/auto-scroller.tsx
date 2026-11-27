"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * A horizontal row that advances one item at a time on its own and loops.
 * Native scroll-snap, so swiping works everywhere. Pauses on hover, focus or
 * touch, when off screen, in a background tab, and for reduced motion; has a
 * pause button, arrows (from sm) and dots. Children must be <li> elements;
 * set their widths per breakpoint where you render them.
 */
export function AutoScroller({ label, interval = 4500, className, children }: {
  label: string; interval?: number; className?: string; children: React.ReactNode;
}) {
  const track = React.useRef<HTMLUListElement>(null);
  const root = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [pages, setPages] = React.useState(1);
  const [userPaused, setUserPaused] = React.useState(false);
  const [holding, setHolding] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const [reduced, setReduced] = React.useState(false);
  const paused = userPaused || holding || !visible || reduced;

  const items = () => Array.from(track.current?.children ?? []) as HTMLElement[];

  // How many "stops" there are: items not already in view at the end of the row.
  const measure = React.useCallback(() => {
    const el = track.current;
    if (!el) return;
    const list = items();
    const max = el.scrollWidth - el.clientWidth;
    const stops = list.filter((li) => li.offsetLeft - list[0].offsetLeft <= max + 2).length;
    setPages(Math.max(1, stops));
    const left = el.scrollLeft;
    const i = list.reduce((best, li, k) => (Math.abs(li.offsetLeft - list[0].offsetLeft - left) < Math.abs(list[best].offsetLeft - list[0].offsetLeft - left) ? k : best), 0);
    setIndex(Math.min(i, Math.max(0, stops - 1)));
  }, []);

  const goTo = React.useCallback((i: number) => {
    const el = track.current;
    const list = items();
    if (!el || list.length === 0) return;
    const next = ((i % pages) + pages) % pages;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: list[next].offsetLeft - list[0].offsetLeft, behavior: smooth ? "smooth" : "auto" });
  }, [pages]);

  React.useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const setR = () => setReduced(mq.matches);
    setR();
    mq.addEventListener("change", setR);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && document.visibilityState === "visible"), { threshold: 0.3 });
    if (root.current) io.observe(root.current);
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => { ro.disconnect(); el.removeEventListener("scroll", measure); mq.removeEventListener("change", setR); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [measure]);

  React.useEffect(() => {
    if (paused || pages < 2) return;
    const t = window.setTimeout(() => goTo(index + 1), interval);
    return () => window.clearTimeout(t);
  }, [index, paused, pages, goTo, interval]);

  return (
    <div ref={root} className={cn("relative", className)}
      onMouseEnter={() => setHolding(true)} onMouseLeave={() => setHolding(false)}
      onTouchStart={() => setHolding(true)} onTouchEnd={() => window.setTimeout(() => setHolding(false), 2500)}
      onFocusCapture={() => setHolding(true)} onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHolding(false); }}>
      <ul ref={track} aria-label={label}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden [&>li]:shrink-0 [&>li]:snap-start">
        {children}
      </ul>

      {pages > 1 && (
        <div className="mt-2 flex items-center justify-center gap-3 sm:justify-end">
          <div className="flex items-center gap-1" role="group" aria-label={`${label}: choose position`}>
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} type="button" onClick={() => goTo(i)} aria-label={`Go to item ${i + 1}`} aria-current={i === index ? "true" : undefined} className="group grid h-8 place-items-center px-0.5">
                <span className={cn("block h-2 overflow-hidden rounded-pill transition-all duration-base", i === index ? "w-8 bg-ink/15" : "w-2 bg-ink/25 group-hover:bg-ink/50")}>
                  {i === index && (
                    <span key={`${index}-${paused}`} className="block h-full rounded-pill bg-sky-600"
                      style={reduced ? { width: "100%" } : { animation: `promo-progress ${interval}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }} />
                  )}
                </span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setUserPaused((p) => !p)} aria-label={userPaused ? "Play" : "Pause"}
            className="grid size-8 place-items-center rounded-pill border border-line bg-paper text-ink-soft hover:border-sky-500 hover:text-ink">
            {userPaused || reduced
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>}
          </button>
          <div className="hidden gap-2 sm:flex">
            {([-1, 1] as const).map((dir) => (
              <button key={dir} type="button" onClick={() => goTo(index + dir)} aria-label={dir === 1 ? "Next" : "Previous"}
                className="grid size-9 place-items-center rounded-pill border border-line bg-paper text-ink hover:border-sky-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={dir === 1 ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
