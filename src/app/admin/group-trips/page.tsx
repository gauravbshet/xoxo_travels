import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { Badge, Button } from "@/components/ui";
import { formatDateRange, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Group trips" };

export default async function AdminTrips() {
  await adminOr404();
  const rows = await db!.groupTrip.findMany({
    orderBy: [{ active: "desc" }, { startDate: "asc" }],
    select: { id: true, slug: true, title: true, startDate: true, endDate: true, price: true, seatsTotal: true, active: true, featured: true,
      destination: { select: { name: true } }, _count: { select: { waitlist: true } },
      bookings: { where: { status: { in: ["confirmed", "completed"] } }, select: { travelers: true } } },
  });
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <AdminHeader title="Group trips" blurb={`${rows.length} trips.`} action={<Button href="/admin/group-trips/new">New trip</Button>} />
      {rows.length === 0 ? <Panel className="p-6 text-center text-ink-soft">No trips yet.</Panel> : (
        <Table>
          <thead><tr><th className={th}>Trip</th><th className={th}>Dates</th><th className={th}>Price</th><th className={th}>Seats sold</th><th className={th}>Waitlist</th><th className={th}>Status</th></tr></thead>
          <tbody>
            {rows.map((t) => {
              const sold = t.bookings.reduce((a, b) => a + b.travelers, 0);
              const past = t.endDate.toISOString().slice(0, 10) < today;
              return (
                <tr key={t.id} className={t.active && !past ? "" : "bg-cream/60"}>
                  <td className={td}><Link href={`/admin/group-trips/${t.id}`} className="font-semibold text-ink hover:text-sky-600">{t.title}</Link><p className="text-xs text-ink-mute">{t.destination.name}</p></td>
                  <td className={td}>{formatDateRange(t.startDate.toISOString(), t.endDate.toISOString())}</td>
                  <td className={`${td} tabular`}>{formatINR(t.price)}</td>
                  <td className={`${td} tabular`}>{sold} / {t.seatsTotal}</td>
                  <td className={`${td} tabular`}>{t._count.waitlist}</td>
                  <td className={td}><div className="flex flex-wrap gap-1">
                    {past ? <Badge tone="neutral">Past</Badge> : t.active ? <Badge tone="green">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
                    {sold >= t.seatsTotal && !past && <Badge tone="coral">Sold out</Badge>}
                    {t.featured && <Badge tone="blue">Featured</Badge>}
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
