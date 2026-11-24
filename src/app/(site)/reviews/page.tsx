import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Reviews" };

export default function Page() {
  return <PagePlaceholder title="Reviews" blurb="What travelers say after their trip." step="step 7" />;
}
