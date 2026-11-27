import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "blue" | "coral" | "green" | "yellow" | "neutral" | "trust";

const tones: Record<Tone, string> = {
  blue: "bg-sky-50 text-sky-700",
  coral: "bg-coral-50 text-coral-700",
  green: "bg-leaf-50 text-leaf-600",
  yellow: "bg-sun-50 text-[#7a5a00]",
  neutral: "bg-cream-deep text-ink-soft",
  trust: "bg-trust-50 text-trust-700",
};

export function Badge({
  tone = "neutral",
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold leading-none",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}

/** Blue check badge on ID-verified traveler profiles (trust colour, distinct from the brand green). */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <Badge tone="trust" className={className} aria-label="Verified traveler">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified
    </Badge>
  );
}
