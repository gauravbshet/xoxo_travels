import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Terms of use" };

export default function Page() {
  return <PagePlaceholder title="Terms of use" blurb="Booking terms and conditions." step="phase 6" />;
}
