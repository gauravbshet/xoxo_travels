import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { BookingStatus } from "@/components/bookings/booking-status";
import { Badge } from "@/components/ui";
import { getBookingById } from "@/lib/data/bookings";
import { booking as rules, extraServices, refundShare } from "@/config/booking";
import { CancelPanel } from "@/components/admin/cancel-panel";
import { formatDate, formatDateRange, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Booking" };

export default async function AdminBooking({ params }: PageProps<"/admin/bookings/[reference]">) {
  await adminOr404();
  const { reference } = await params;
  const row = await db!.booking.findUnique({
    where: { reference },
    select: { id: true, status: true, travelDate: true, notes: true, confirmationEmailAt: true, visaAssistance: true, esimRequired: true, flightAssistance: true, user: { select: { email: true, phone: true, profile: { select: { displayName: true } } } },
      payments: { orderBy: { createdAt: "desc" }, select: { id: true, razorpayOrderId: true, razorpayPaymentId: true, amount: true, status: true, method: true, createdAt: true } } },
  });
  if (!row) notFound();
  const b = (await getBookingById(row.id))!;
  const captured = row.payments.find((p) => p.status === "captured") ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const policy = refundShare(row.travelDate ? Math.floor((row.travelDate.getTime() - new Date(today).getTime()) / 86_400_000) : 0);
  const dates = b.startDate && b.endDate ? formatDateRange(b.startDate, b.endDate) : b.startDate ? formatDate(b.startDate) : "—";

  return (
    <>
      <p className="mb-2 flex flex-wrap justify-between gap-2 text-sm"><Link href="/admin/bookings" className="text-sky-600 hover:underline">← All bookings</Link><Link href={`/account/bookings/${reference}/invoice`} className="font-semibold text-sky-700 hover:underline">GST invoice</Link></p>
      <AdminHeader title={b.reference} blurb={`Created ${formatDate(b.createdAt)}`} action={<BookingStatus status={b.status} />} />

      {row.notes && <Panel className="mb-6 whitespace-pre-line bg-cream-deep p-4 text-sm text-ink">{row.notes}</Panel>}

      {(captured || row.status === "pending") && (row.status === "confirmed" || row.status === "pending" || (row.status === "cancelled" && captured)) && (
        <Panel className="mb-6 p-5">
          <h2 className="mb-3 text-lg">{row.status === "cancelled" ? "Refund owed" : "Cancel booking"}</h2>
          <CancelPanel reference={b.reference} paid={captured ? captured.amount / 100 : null} policyShare={policy.share} policyLabel={policy.label} owed={row.status === "cancelled"} />
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-lg">Trip</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Item"><Link href={b.href} className="font-semibold text-sky-600 hover:underline" target="_blank">{b.title}</Link> <Badge>{b.kind === "trip" ? "Group trip" : "Package"}</Badge></Row>
            <Row k="Dates">{dates}</Row>
            <Row k="Travelers">{b.travelers}</Row>
            {b.leader && <Row k="Leader">{b.leader}</Row>}
          </dl>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-lg">Customer</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Account">{row.user.profile?.displayName ?? "—"} · {row.user.email}</Row>
            <Row k="Lead traveler">{b.contact.name || "—"}</Row>
            <Row k="Contact">{b.contact.email || "—"} · {b.contact.phone || "—"}</Row>
            <Row k="Email sent">{row.confirmationEmailAt ? formatDate(row.confirmationEmailAt.toISOString()) : "Not yet"}</Row>
          </dl>
          {b.people.length > 0 && (
            <ul className="mt-3 border-t border-line/70 pt-3 text-sm">
              {b.people.map((p, i) => <li key={i} className="flex justify-between py-0.5"><span>{p.name}{i === 0 ? " (lead)" : ""}</span><span className="tabular text-ink-soft">{p.age} yrs</span></li>)}
            </ul>
          )}
        </Panel>

        <Panel className="p-5 lg:col-span-2">
          <h2 className="text-lg">Customer requirements</h2>
          {row.status === "pending" ? (
            <p className="mt-2 text-sm text-ink-soft">Not paid yet. Requests are shown only once payment succeeds.</p>
          ) : (
            <>
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                {extraServices.map((x) => {
                  const on = row[x.field];
                  return (
                    <div key={x.key} className="rounded-lg border border-line/70 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-mute">{x.label}</dt>
                      <dd className="mt-1">{on ? <Badge tone="green">Required</Badge> : <span className="text-sm text-ink-soft">Not Required</span>}</dd>
                    </div>
                  );
                })}
              </dl>
              {(row.status === "cancelled" || row.status === "refunded") && <p className="mt-2 text-xs text-ink-mute">This booking is {row.status}, so no action is needed on these.</p>}
            </>
          )}
        </Panel>

        <Panel className="p-5 lg:col-span-2">
          <h2 className="text-lg">Price</h2>
          <dl className="mt-3 max-w-sm space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tabular">{formatINR(b.subtotal)}</dd></div>
            {b.discount > 0 && <div className="flex justify-between"><dt className="text-ink-soft">Coupon {b.couponCode}</dt><dd className="tabular">−{formatINR(b.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-soft">{rules.gstLabel}</dt><dd className="tabular">{formatINR(b.tax)}</dd></div>
            <div className="flex justify-between border-t border-line/70 pt-1.5 font-bold"><dt>Total</dt><dd className="tabular">{formatINR(b.total)}</dd></div>
          </dl>
        </Panel>
      </div>

      <h2 className="mb-3 mt-8 text-lg">Payment attempts</h2>
      {row.payments.length === 0 ? <Panel className="p-6 text-center text-ink-soft">No payment started yet.</Panel> : (
        <Table>
          <thead><tr><th className={th}>Started</th><th className={th}>Order</th><th className={th}>Payment</th><th className={th}>Amount</th><th className={th}>Method</th><th className={th}>Status</th></tr></thead>
          <tbody>
            {row.payments.map((p) => (
              <tr key={p.id}>
                <td className={td}>{p.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className={`${td} font-mono text-xs`}>{p.razorpayOrderId}</td>
                <td className={`${td} font-mono text-xs`}>{p.razorpayPaymentId ?? "—"}</td>
                <td className={`${td} tabular`}>{formatINR(p.amount / 100)}</td>
                <td className={td}>{p.method ?? "—"}</td>
                <td className={td}><Badge tone={p.status === "captured" ? "green" : p.status === "failed" ? "coral" : "neutral"}>{p.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2"><dt className="text-ink-mute">{k}</dt><dd className="text-ink">{children}</dd></div>;
}
