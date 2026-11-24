import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader } from "@/components/admin/ui";
import { PackageForm } from "@/components/admin/package-form";
import { Button } from "@/components/ui";
import { buildDetail } from "@/lib/data/package-details";
import { toPackage } from "@/lib/data/mappers";
import type { Inclusion, PackageDetail, Theme } from "@/lib/types";

export const metadata: Metadata = { title: "Edit package" };

export default async function EditPackage({ params }: PageProps<"/admin/packages/[id]">) {
  await adminOr404();
  const { id } = await params;
  const [row, destinations] = await Promise.all([
    db!.package.findUnique({ where: { id }, include: { destination: { select: { slug: true, name: true, region: true } } } }),
    db!.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!row) notFound();

  // Start from what's saved; fall back to the generated defaults the site shows today.
  const saved = (row.itinerary && typeof row.itinerary === "object" && !Array.isArray(row.itinerary) ? row.itinerary : {}) as Partial<PackageDetail>;
  const defaults = buildDetail(toPackage(row));
  const days = (saved.itinerary ?? defaults.itinerary).map((d) => ({ title: d.title, body: d.body, meals: (d.meals ?? []) as ("Breakfast" | "Lunch" | "Dinner")[], stay: d.stay ?? "" }));

  return (
    <>
      <AdminHeader title={row.title} blurb={row.itinerary ? "Itinerary is customised." : "The itinerary below is the generated default. Edit and save to customise it."}
        action={<Button href={`/holidays/${row.slug}`} variant="outline" size="sm" target="_blank">View on site</Button>} />
      <PackageForm destinations={destinations} initial={{
        id: row.id, title: row.title, slug: row.slug, destinationId: row.destinationId, nights: row.nights, price: row.price, listPrice: row.listPrice,
        imageSrc: row.imageSrc, imageAlt: row.imageAlt, highlights: row.highlights.length ? row.highlights : [""],
        inclusions: row.inclusions as Inclusion[], themes: row.themes as Theme[],
        bestseller: row.bestseller, featured: row.featured, active: row.active,
        days, exclusions: saved.exclusions ?? defaults.exclusions, goodToKnow: saved.goodToKnow ?? defaults.goodToKnow,
      }} />
    </>
  );
}
