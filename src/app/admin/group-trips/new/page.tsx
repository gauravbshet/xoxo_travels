import type { Metadata } from "next";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader } from "@/components/admin/ui";
import { TripForm } from "@/components/admin/trip-form";

export const metadata: Metadata = { title: "New group trip" };

export default async function NewTrip() {
  await adminOr404();
  const destinations = await db!.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <AdminHeader title="New group trip" blurb="Saved trips appear on the site straight away when Active is on." />
      <TripForm destinations={destinations} sold={0} initial={{
        title: "", slug: "", destinationId: "", style: "backpacking", startDate: "", endDate: "", price: 0, seatsTotal: 16,
        imageSrc: "", imageAlt: "", leader: "", featured: false, active: false,
        days: [], inclusions: [], exclusions: [], goodToKnow: [], meetingPoint: "", leaderBio: "",
      }} />
    </>
  );
}
