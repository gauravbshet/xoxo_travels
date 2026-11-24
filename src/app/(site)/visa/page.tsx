import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Visa assistance" };

export default function Page() {
  return <PagePlaceholder title="Visa assistance" blurb="Document checklists and application help for international trips." step="step 8" />;
}
