import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton", className)} />;
}

/** Placeholder matching the destination / package card shape. */
export function CardSkeleton() {
  return (
    <div className="rounded-lg bg-paper border border-line/70 overflow-hidden">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between pt-1">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-20 rounded-pill" />
        </div>
      </div>
    </div>
  );
}
