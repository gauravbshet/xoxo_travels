"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function CopyCode({ code, className }: { code: string; className?: string }) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle");
  const timer = React.useRef<number>(0);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2000);
  };
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={cn(
        "group/copy inline-flex h-10 items-center gap-2 rounded-md border border-dashed border-ink/30 bg-paper pl-3 pr-2 font-mono text-sm font-bold tracking-wider text-ink",
        "transition-colors duration-fast hover:border-sky-500",
        className,
      )}
    >
      <span>{code}</span>
      <span className={cn("rounded-sm px-2 py-1 font-sans text-xs font-bold tracking-normal transition-colors duration-fast",
        state === "copied" ? "bg-leaf-600 text-white" : state === "failed" ? "bg-coral-600 text-white" : "bg-sky-50 text-sky-700 group-hover/copy:bg-sky-600 group-hover/copy:text-white")}>
        {state === "copied" ? "Copied" : state === "failed" ? "Select & copy" : "Copy"}
      </span>
    </button>
  );
}
