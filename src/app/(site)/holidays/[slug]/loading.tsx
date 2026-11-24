import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container-x pb-16 pt-8" aria-busy="true" aria-label="Loading package">
      <Skeleton className="mb-4 h-4 w-56" />
      <Skeleton className="mb-6 h-12 w-3/4 max-w-xl" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <div className="min-w-0 space-y-4">
          <Skeleton className="aspect-[4/3] w-full rounded-xl sm:aspect-[16/9]" />
          <div className="flex gap-2 overflow-hidden">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-24" />)}</div>
        </div>
        <Skeleton className="hidden h-[30rem] rounded-xl lg:block" />
      </div>
    </div>
  );
}
