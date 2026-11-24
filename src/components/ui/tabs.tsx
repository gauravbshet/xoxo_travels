"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type TabsContext = { value: string; setValue: (v: string) => void; id: string };
const Ctx = React.createContext<TabsContext | null>(null);

function useTabs() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("Tabs.* must be used inside <Tabs>");
  return ctx;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [inner, setInner] = React.useState(defaultValue);
  const current = value ?? inner;
  const setValue = React.useCallback(
    (v: string) => {
      setInner(v);
      onValueChange?.(v);
    },
    [onValueChange],
  );
  const id = React.useId();
  return (
    <Ctx.Provider value={{ value: current, setValue, id }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

type Variant = "pill" | "ticket";

const listStyles: Record<Variant, string> = {
  pill: "gap-1 rounded-pill bg-cream-deep p-1",
  ticket: "gap-0 w-full sm:w-auto",
};

export function TabList({ className, children, label, variant = "pill" }: { className?: string; children: React.ReactNode; label: string; variant?: Variant }) {
  const ref = React.useRef<HTMLDivElement>(null);

  // Arrow-key navigation between tabs
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const tabs = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
    const i = tabs.findIndex((t) => t === document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next =
      e.key === "ArrowRight" ? (i + 1) % tabs.length
      : e.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length
      : e.key === "Home" ? 0 : tabs.length - 1;
    tabs[next].focus();
    tabs[next].click();
    tabs[next].scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", listStyles[variant], className)}
    >
      {children}
    </div>
  );
}

/*
 * Each variant owns its full shape (radius, padding, active state), so the
 * two never stack classes on the same property.
 */
const tabStyles: Record<Variant, { base: string; on: string; off: string }> = {
  pill: {
    base: "rounded-pill px-4 py-2",
    on: "bg-paper text-sky-600 shadow-card",
    off: "text-ink-soft hover:text-ink",
  },
  ticket: {
    base: "inline-flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-t-md px-1.5 py-2.5 text-xs leading-tight sm:flex-none sm:flex-row sm:gap-2 sm:px-5 sm:py-3 sm:text-sm",
    on: "bg-paper text-sky-600",
    off: "text-ink-soft hover:text-ink",
  },
};

export function Tab({ value, className, children, variant = "pill", accent }: {
  value: string; className?: string; children: React.ReactNode; variant?: Variant;
  /** Coral text for a standout tab (Find a partner) */
  accent?: boolean;
}) {
  const { value: current, setValue, id } = useTabs();
  const active = current === value;
  const t = tabStyles[variant];
  return (
    <button
      role="tab"
      type="button"
      id={`${id}-tab-${value}`}
      aria-selected={active}
      aria-controls={`${id}-panel-${value}`}
      tabIndex={active ? 0 : -1}
      onClick={() => setValue(value)}
      className={cn(
        "shrink-0 text-sm font-semibold transition-colors duration-fast",
        t.base,
        active ? t.on : t.off,
        accent && "text-coral-700 hover:text-coral-700",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const { value: current, id } = useTabs();
  if (current !== value) return null;
  return (
    <div role="tabpanel" id={`${id}-panel-${value}`} aria-labelledby={`${id}-tab-${value}`} tabIndex={0} className={className}>
      {children}
    </div>
  );
}
