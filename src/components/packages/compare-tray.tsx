"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { COMPARE_MAX, useCompare } from "./compare-store";

/* Floating tray that appears once a package is added to compare. */
export function CompareTray() {
  const { list, clear } = useCompare();
  const open = list.length > 0;
  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 bottom-[var(--bottom-bar,0px)] z-40 flex justify-center px-4 pb-4 transition-[transform,opacity] duration-base ease-out-soft",
        open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <div className="glass flex w-full max-w-lg items-center gap-3 rounded-pill py-2 pl-5 pr-2 shadow-card-hover">
        <p className="flex-1 text-sm font-semibold text-ink">
          {list.length} of {COMPARE_MAX} selected
          <span className="hidden text-ink-mute sm:inline"> · pick up to {COMPARE_MAX} packages</span>
        </p>
        <button type="button" onClick={clear} className="rounded-pill px-3 py-2 text-sm font-semibold text-ink-soft hover:text-ink">Clear</button>
        <Link
          href={`/holidays/compare?p=${list.join(",")}`}
          aria-disabled={list.length < 2}
          className={cn("rounded-pill bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-float hover:bg-sky-700", list.length < 2 && "pointer-events-none opacity-50")}
        >
          Compare
        </Link>
      </div>
    </div>
  );
}
