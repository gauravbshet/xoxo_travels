import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Support" };

export default function Page() {
  return <PagePlaceholder title="Support" blurb="Help centre, visa assistance and contact." step="step 8" />;
}
