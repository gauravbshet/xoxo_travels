"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Fades + lifts children in once they scroll into view. One observer per
 * element; it disconnects after the first reveal. Reduced-motion users see
 * content immediately (handled in the .reveal utility).
 */
export function Reveal({
  as: Tag = "div", delay = 0, className, children, ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: "div" | "section" | "li" | "article"; delay?: number }) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { el.classList.add("is-visible"); return; }
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("is-visible"); io.disconnect(); } },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={cn("reveal", className)} style={delay ? { transitionDelay: `${delay}ms` } : undefined} {...rest}>
      {children}
    </Tag>
  );
}
