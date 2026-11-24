import { CardSkeleton, Skeleton } from "@/components/ui";

/* Shown while an uncached destination renders. Matches the page's shape. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading destination">
      <div className="bg-cream-deep">
        <div className="container-x space-y-4 pb-10 pt-24 sm:pb-14 sm:pt-32">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-14 w-72" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
      </div>
      <div className="container-x py-12 sm:py-16">
        <Skeleton className="mb-7 h-9 w-64" />
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <li key={i}><CardSkeleton /></li>)}
        </ul>
      </div>
    </div>
  );
}
