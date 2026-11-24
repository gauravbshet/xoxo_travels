import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader } from "@/components/admin/ui";
import { TripForm } from "@/components/admin/trip-form";
import { Button } from "@/components/ui";
import { buildTripDetail } from "@/lib/data/group-trips";
import { toGroupTrip } from "@/lib/data/mappers";
import type { GroupTripDetail } from "@/lib/types";

export const metadata: Metadata = { title: "Edit group trip" };

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function EditTrip({ params }: PageProps<"/admin/group-trips/[id]">) {
  await adminOr404();
  const { id } = await params;
  const [t, destinations, sold] = await Promise.all([
    db!.groupTrip.findUnique({ where: { id }, include: { destination: { select: { slug: true, name: true, region: true } } } }),
    db!.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db!.booking.aggregate({ _sum: { travelers: true }, where: { groupTripId: id, status: { in: ["confirmed", "completed"] } } }),
  ]);
  if (!t) notFound();
  const saved = (t.itinerary && typeof t.itinerary === "object" && !Array.isArray(t.itinerary) ? t.itinerary : {}) as Partial<GroupTripDetail>;
  const defaults = buildTripDetail(toGroupTrip({ ...t, seatsBooked: 0 }));
  const days = (saved.itinerary ?? defaults.itinerary).map((d) => ({ title: d.title, body: d.body, meals: (d.meals ?? []) as ("Breakfast" | "Lunch" | "Dinner")[], stay: d.stay ?? "" }));

  return (
    <>
      <AdminHeader title={t.title} blurb={t.itinerary ? "Itinerary is customised." : "Showing the generated defaults. Edit and save to customise."}
        action={<Button href={`/group-trips/${t.slug}`} variant="outline" size="sm" target="_blank">View on site</Button>} />
      <TripForm destinations={destinations} sold={sold._sum.travelers ?? 0} initial={{
        id: t.id, title: t.title, slug: t.slug, destinationId: t.destinationId, style: t.style, startDate: iso(t.startDate), endDate: iso(t.endDate),
        price: t.price, seatsTotal: t.seatsTotal, imageSrc: t.imageSrc, imageAlt: t.imageAlt, leader: t.leader, featured: t.featured, active: t.active,
        days, inclusions: saved.inclusions ?? defaults.inclusions, exclusions: saved.exclusions ?? defaults.exclusions, goodToKnow: saved.goodToKnow ?? defaults.goodToKnow,
        meetingPoint: saved.meetingPoint ?? "", leaderBio: saved.leaderBio ?? "",
      }} />
    </>
  );
}
