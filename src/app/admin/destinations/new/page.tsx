import type { Metadata } from "next";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader } from "@/components/admin/ui";
import { DestinationForm } from "@/components/admin/destination-form";

export const metadata: Metadata = { title: "New destination" };

export default async function NewDestination() {
  await adminOr404();
  return (
    <>
      <AdminHeader title="New destination" />
      <DestinationForm initial={{ name: "", slug: "", area: "", region: "domestic", tagline: "", imageSrc: "", imageAlt: "", bestMonths: "", tags: [], featured: false, sortOrder: 50 }} />
    </>
  );
}
