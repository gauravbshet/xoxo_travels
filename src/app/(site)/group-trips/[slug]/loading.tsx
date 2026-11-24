import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container-x pb-16 pt-8" aria-busy="true" aria-label="Loading trip">
      <Skeleton className="mb-4 h-4 w-56" />
      <Skeleton className="mb-6 h-12 w-3/4 max-w-xl" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <Skeleton className="aspect-[4/3] w-full rounded-xl sm:aspect-[16/9]" />
        <Skeleton className="hidden h-[26rem] rounded-xl lg:block" />
      </div>
    </div>
  );
}
