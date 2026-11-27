"use client";

import * as React from "react";
import { Badge } from "@/components/ui";

/* "Ends in N days" badge, worked out in the browser (the server prerenders without a clock).
   Shows nothing on the server and when the end date is more than a week away. */
const noop = () => () => {};
export function EndingSoon({ till, className }: { till: string; className?: string }) {
  const today = React.useSyncExternalStore(noop, () => new Date().toISOString().slice(0, 10), () => null);
  if (!today) return null;
  const d = Math.round((new Date(till).getTime() - new Date(today).getTime()) / 86_400_000);
  if (d < 0 || d > 7) return null;
  return <Badge tone="coral" className={className}>{d === 0 ? "Ends today" : `Ends in ${d} ${d === 1 ? "day" : "days"}`}</Badge>;
}
