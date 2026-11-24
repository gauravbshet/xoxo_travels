import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "About XOXO Travels" };

export default function Page() {
  return <PagePlaceholder title="About XOXO Travels" blurb="Who we are and how we plan trips." step="step 8" />;
}
