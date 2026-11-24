import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Phone: a swipeable row (scroll-snap) where the next card peeks in, so long
 * lists don't become a tall stack. From `from` up: a normal grid.
 * No JS; items are plain list items.
 */
export function Rail({ label, from = "md", gridClassName, className, children }: {
  label: string;
  /** Breakpoint where the rail turns into a grid. */
  from?: "sm" | "md";
  /** Grid columns from that breakpoint, e.g. "md:grid-cols-2 xl:grid-cols-3". */
  gridClassName: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ul
      aria-label={label}
      className={cn(
        "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "[&>li]:w-[86%] [&>li]:max-w-sm [&>li]:shrink-0 [&>li]:snap-start",
        from === "sm"
          ? "sm:mx-0 sm:grid sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:[&>li]:w-auto sm:[&>li]:max-w-none"
          : "md:mx-0 md:grid md:gap-5 md:overflow-visible md:px-0 md:pb-0 md:[&>li]:w-auto md:[&>li]:max-w-none",
        gridClassName,
        className,
      )}
    >
      {children}
    </ul>
  );
}
