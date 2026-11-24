import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return <PagePlaceholder title="Sign in" blurb="Email, Google or phone OTP." step="phase 4" />;
}
