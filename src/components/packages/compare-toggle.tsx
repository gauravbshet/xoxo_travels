"use client";

import { cn } from "@/lib/cn";
import { useCompare } from "./compare-store";

export function CompareToggle({ slug, className }: { slug: string; className?: string }) {
  const { has, full, toggle } = useCompare();
  const on = has(slug);
  const disabled = !on && full;
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(slug); }}
      aria-pressed={on}
      disabled={disabled}
      title={disabled ? "You can compare up to 3 packages" : on ? "Remove from compare" : "Add to compare"}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-pill border px-3 text-xs font-bold transition-colors duration-fast",
        on ? "border-sky-600 bg-sky-600 text-white" : "border-line bg-paper text-ink-soft hover:border-sky-500 hover:text-sky-600",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {on ? <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            : <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
      </svg>
      {on ? "Added" : "Compare"}
    </button>
  );
}
