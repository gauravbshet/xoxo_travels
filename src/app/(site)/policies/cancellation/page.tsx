import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Cancellation & refunds" };

export default function Page() {
  return <PagePlaceholder title="Cancellation & refunds" blurb="Refund slabs by days before departure." step="phase 6" />;
}
