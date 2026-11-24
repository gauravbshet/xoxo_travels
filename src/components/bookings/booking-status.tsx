import { Badge } from "@/components/ui";
import type { BookingStatusView } from "@/lib/data/bookings";

const map: Record<BookingStatusView, { label: string; tone: "green" | "yellow" | "coral" | "neutral" | "blue" }> = {
  confirmed: { label: "Confirmed", tone: "green" },
  pending: { label: "Awaiting payment", tone: "yellow" },
  expired: { label: "Expired", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "coral" },
  refunded: { label: "Refunded", tone: "neutral" },
  completed: { label: "Completed", tone: "blue" },
};

export function BookingStatus({ status }: { status: BookingStatusView }) {
  const s = map[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
