"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Scroll-snap carousel. Native swipe on touch; arrow buttons on pointer
 * devices. Children are plain list items, so links inside stay keyboard-
 * reachable with no JS involved.
 */
export function Carousel({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  const track = React.useRef<HTMLUListElement>(null);
  const [edge, setEdge] = React.useState<{ start: boolean; end: boolean }>({ start: true, end: false });

  const update = React.useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
  }, []);

  React.useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener("scroll", update); };
  }, [update]);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>(":scope > *");
    const step = first ? first.offsetWidth + 16 : el.clientWidth * 0.8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step * (el.clientWidth >= 1024 ? 2 : 1), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      <ul
        ref={track}
        aria-label={label}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0"
      >
        {children}
      </ul>

      <div className="mt-4 hidden justify-end gap-2 sm:flex">
        <ArrowButton dir={-1} disabled={edge.start} onClick={() => scroll(-1)} label="Previous" />
        <ArrowButton dir={1} disabled={edge.end} onClick={() => scroll(1)} label="Next" />
      </div>
    </div>
  );
}

function ArrowButton({ dir, disabled, onClick, label }: { dir: 1 | -1; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-11 place-items-center rounded-pill border border-line bg-paper text-ink shadow-card transition-[background-color,color,opacity] duration-fast hover:bg-sky-500 hover:text-white disabled:pointer-events-none disabled:opacity-35"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: dir === -1 ? "scaleX(-1)" : undefined }}>
        <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
