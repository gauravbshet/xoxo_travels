"use client";

import * as React from "react";

/**
 * Counts up to `value` once scrolled into view. Reduced-motion users (and
 * the server render) get the final value immediately.
 */
export function Counter({ value, decimals = 0, suffix = "", duration = 1400, className }: {
  value: number; decimals?: number; suffix?: string; duration?: number; className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const fmt = React.useMemo(() => new Intl.NumberFormat("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }), [decimals]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt.format(value * eased) + suffix;
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value, duration, suffix, fmt]);

  return <span ref={ref} className={className}>{fmt.format(value)}{suffix}</span>;
}
