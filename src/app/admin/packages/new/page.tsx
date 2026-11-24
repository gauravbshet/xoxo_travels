import type { Metadata } from "next";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader } from "@/components/admin/ui";
import { PackageForm } from "@/components/admin/package-form";

export const metadata: Metadata = { title: "New package" };

export default async function NewPackage() {
  await adminOr404();
  const destinations = await db!.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <AdminHeader title="New package" blurb="Saved packages appear on the site straight away when Active is on." />
      <PackageForm destinations={destinations} initial={{
        title: "", slug: "", destinationId: "", nights: 4, price: 0, listPrice: null, imageSrc: "", imageAlt: "",
        highlights: [""], inclusions: ["hotel", "meals", "transfers"], themes: [], bestseller: false, featured: false, active: false,
        days: [], exclusions: [], goodToKnow: [],
      }} />
    </>
  );
}
