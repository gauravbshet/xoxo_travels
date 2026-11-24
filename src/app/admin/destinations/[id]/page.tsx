import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader } from "@/components/admin/ui";
import { DestinationForm } from "@/components/admin/destination-form";
import { Button } from "@/components/ui";

export const metadata: Metadata = { title: "Edit destination" };

export default async function EditDestination({ params }: PageProps<"/admin/destinations/[id]">) {
  await adminOr404();
  const d = await db!.destination.findUnique({ where: { id: (await params).id } });
  if (!d) notFound();
  return (
    <>
      <AdminHeader title={d.name} action={<Button href={`/destinations/${d.slug}`} variant="outline" size="sm" target="_blank">View on site</Button>} />
      <DestinationForm initial={{ id: d.id, name: d.name, slug: d.slug, area: d.area, region: d.region, tagline: d.tagline, imageSrc: d.imageSrc, imageAlt: d.imageAlt, bestMonths: d.bestMonths, tags: d.tags, featured: d.featured, sortOrder: d.sortOrder }} />
    </>
  );
}
