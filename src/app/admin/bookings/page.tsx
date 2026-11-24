import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader, Pager, Panel, Table, td, th } from "@/components/admin/ui";
import { BookingStatus } from "@/components/bookings/booking-status";
import { Badge, Button, FilterChips } from "@/components/ui";
import { extraServices } from "@/config/booking";
import { formatDate, formatINR } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Bookings" };

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "refunded"] as const;
const PER_PAGE = 25;

export default async function AdminBookings({ searchParams }: PageProps<"/admin/bookings">) {
  await adminOr404();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const status = STATUSES.find((s) => s === sp.status);
  // "Needs" filter: paid bookings that asked for a given extra (columns are only set on payment).
  const need = extraServices.find((x) => x.key === sp.needs);
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.BookingWhereInput = {
    ...(status && { status }),
    ...(need && { [need.field]: true, ...(!status && { status: { in: ["confirmed", "completed"] } }) }),
    ...(q && { OR: [
      { reference: { contains: q.toUpperCase() } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { package: { title: { contains: q, mode: "insensitive" } } },
      { groupTrip: { title: { contains: q, mode: "insensitive" } } },
    ] }),
  };
  const [total, rows] = await Promise.all([
    db!.booking.count({ where }),
    db!.booking.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE,
      select: { reference: true, status: true, total: true, visaAssistance: true, esimRequired: true, flightAssistance: true, travelers: true, travelDate: true, createdAt: true, notes: true,
        user: { select: { email: true } }, package: { select: { title: true } }, groupTrip: { select: { title: true } } },
    }),
  ]);

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (need) params.set("needs", need.key);
  const hrefFor = (p: number) => { const n = new URLSearchParams(params); if (p > 1) n.set("page", String(p)); return `/admin/bookings${n.size ? `?${n}` : ""}`; };

  return (
    <>
      <AdminHeader title="Bookings" blurb={`${total} ${total === 1 ? "booking" : "bookings"}. Open one to cancel or refund it.`} />
      <Panel className="mb-4 px-4 sm:px-5">
        <FilterChips label="Status" param="status" base="/admin/bookings" params={params} current={status}
          chips={[{ label: "All" }, ...STATUSES.map((s) => ({ label: s[0].toUpperCase() + s.slice(1), value: s }))]} />
        <FilterChips label="Needs" param="needs" base="/admin/bookings" params={params} current={need?.key}
          chips={[{ label: "Any" }, ...extraServices.map((x) => ({ label: x.label, value: x.key }))]} />
      </Panel>
      <form className="mb-4 flex gap-2" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        {need && <input type="hidden" name="needs" value={need.key} />}
        <label htmlFor="q" className="sr-only">Search bookings</label>
        <input id="q" name="q" defaultValue={q} placeholder="Reference, email or trip" className="h-10 w-full max-w-sm rounded-md border border-line bg-paper px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100" />
        <Button type="submit" variant="outline" size="sm" className="h-10">Search</Button>
      </form>

      {rows.length === 0 ? <Panel className="p-6 text-center text-ink-soft">No bookings match.</Panel> : (
        <Table>
          <thead><tr><th className={th}>Reference</th><th className={th}>Customer</th><th className={th}>Trip</th><th className={th}>Travel date</th><th className={th}>Pax</th><th className={th}>Total</th><th className={th}>Extras</th><th className={th}>Status</th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.reference}>
                <td className={td}>
                  <Link href={`/admin/bookings/${b.reference}`} className="font-mono font-semibold text-sky-600 hover:underline">{b.reference}</Link>
                  <p className="text-xs text-ink-mute">{formatDate(b.createdAt.toISOString())}</p>
                </td>
                <td className={td}>{b.user.email}</td>
                <td className={td}>{b.package?.title ?? b.groupTrip?.title ?? "—"}</td>
                <td className={`${td} tabular`}>{b.travelDate ? formatDate(b.travelDate.toISOString()) : "—"}</td>
                <td className={`${td} tabular`}>{b.travelers}</td>
                <td className={`${td} tabular`}>{formatINR(b.total / 100)}</td>
                <td className={td}>
                  {b.status === "pending" ? <span className="text-xs text-ink-mute">Unpaid</span> : (
                    <div className="flex flex-wrap gap-1">
                      {extraServices.filter((x) => b[x.field]).map((x) => <Badge key={x.key} tone="blue">{x.label}</Badge>)}
                      {!extraServices.some((x) => b[x.field]) && <span className="text-xs text-ink-mute">None</span>}
                    </div>
                  )}
                </td>
                <td className={td}>
                  <BookingStatus status={b.status} />
                  {b.status === "cancelled" && b.notes?.includes("refund due") && <p className="mt-1 text-xs font-semibold text-coral-700">Refund due</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pager page={page} pages={Math.ceil(total / PER_PAGE)} hrefFor={hrefFor} />
    </>
  );
}
