import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Offers & coupons" };

export default function Page() {
  return <PagePlaceholder title="Offers & coupons" blurb="Discount codes you can copy and apply at checkout." step="step 7" />;
}
