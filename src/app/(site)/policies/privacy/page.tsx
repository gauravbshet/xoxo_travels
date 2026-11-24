import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Page() {
  return <PagePlaceholder title="Privacy policy" blurb="How we handle your data." step="phase 6" />;
}
