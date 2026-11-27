import { Skeleton } from "@/components/ui";

/* Instant placeholder while an admin page loads. Admin pages always render per
   request (fresh data, role checked each time), so this keeps navigation snappy. */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-4">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
