import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { BookingStatus } from "@/components/bookings/booking-status";
import { formatDate, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

const PAID = ["confirmed", "completed"] as const;

export default async function AdminOverview() {
  await adminOr404();
  const client = db!;
  const since = new Date(); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - 29);
  const today = new Date().toISOString().slice(0, 10);

  const [revenue, recentPaid, topRaw, latest, signups, pendingBookings, verifications, reports, reviews, activePackages] = await Promise.all([
    client.booking.aggregate({ _sum: { total: true }, _count: { _all: true }, where: { status: { in: [...PAID] } } }),
    client.booking.findMany({ where: { status: { in: [...PAID] }, createdAt: { gte: since } }, select: { createdAt: true, total: true } }),
    client.booking.groupBy({ by: ["packageId"], where: { status: { in: [...PAID] }, packageId: { not: null } }, _count: { _all: true }, _sum: { total: true }, orderBy: { _sum: { total: "desc" } }, take: 5 }),
    client.booking.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { reference: true, status: true, total: true, user: { select: { email: true } }, package: { select: { title: true } }, groupTrip: { select: { title: true } } } }),
    client.user.findMany({ where: { clerkId: { not: { startsWith: "seed_" } } }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, email: true, createdAt: true, profile: { select: { displayName: true } } } }),
    client.booking.count({ where: { status: "pending", OR: [{ travelDate: null }, { travelDate: { gte: new Date(today) } }] } }),
    client.verification.count({ where: { status: "pending" } }),
    client.report.count({ where: { resolved: false } }),
    client.review.count({ where: { approved: false } }),
    client.package.count({ where: { active: true } }),
  ]);

  // 30 daily buckets (server-local calendar days), oldest first, including empty days.
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(since); d.setDate(d.getDate() + i); return { date: key(d), revenue: 0, bookings: 0 }; });
  const byKey = new Map(days.map((d) => [d.date, d]));
  for (const b of recentPaid) {
    const day = byKey.get(key(b.createdAt));
    if (day) { day.revenue += b.total / 100; day.bookings += 1; }
  }
  const titles = await client.package.findMany({ where: { id: { in: topRaw.map((t) => t.packageId!).filter(Boolean) } }, select: { id: true, title: true } });

  const stats: [string, string][] = [
    ["Confirmed revenue", formatINR((revenue._sum.total ?? 0) / 100)],
    ["Confirmed bookings", String(revenue._count._all)],
    ["Active packages", String(activePackages)],
  ];
  const todo: [string, number, string][] = [
    ["Awaiting payment", pendingBookings, "/admin/bookings?status=pending"],
    ["IDs to verify", verifications, "/admin/verifications"],
    ["Open reports", reports, "/admin/reports"],
    ["Reviews to check", reviews, "/admin/reviews"],
  ];

  return (
    <>
      <AdminHeader title="Overview" blurb="Amounts include GST." />
      <dl className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map(([k, v]) => (
          <Panel key={k} className="p-4"><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-mute">{k}</dt><dd className="mt-1 font-display text-2xl font-extrabold tabular text-ink">{v}</dd></Panel>
        ))}
      </dl>

      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {todo.map(([k, n, href]) => (
          <li key={k}>
            <Link href={href} className="block rounded-xl border border-line/70 bg-paper p-4 shadow-card hover:border-sky-500">
              <span className="text-sm text-ink-soft">{k}</span>
              <span className={`mt-0.5 block font-display text-2xl font-extrabold tabular ${n ? "text-ink" : "text-ink-mute"}`}>{n}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Panel className="mb-6 p-5"><RevenueChart days={days} /></Panel>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="mb-3 text-lg">Top packages</h2>
          {topRaw.length === 0 ? <p className="text-sm text-ink-soft">No confirmed bookings yet.</p> : (
            <ol className="space-y-2 text-sm">
              {topRaw.map((t, i) => (
                <li key={t.packageId} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate"><span className="mr-2 text-ink-mute tabular">{i + 1}.</span>{titles.find((x) => x.id === t.packageId)?.title ?? "—"}</span>
                  <span className="shrink-0 tabular text-ink-soft">{t._count._all} · <strong className="text-ink">{formatINR((t._sum.total ?? 0) / 100)}</strong></span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel className="p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg">New travelers</h2><Link href="/admin/customers" className="text-sm font-semibold text-sky-600 hover:underline">All customers</Link></div>
          {signups.length === 0 ? <p className="text-sm text-ink-soft">No signups yet.</p> : (
            <ul className="space-y-2 text-sm">
              {signups.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3">
                  <Link href={`/admin/customers/${u.id}`} className="min-w-0 truncate font-semibold text-ink hover:text-sky-600">{u.profile?.displayName ?? u.email}</Link>
                  <span className="shrink-0 text-ink-mute">{formatDate(u.createdAt.toISOString())}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg">Latest bookings</h2>
        <Link href="/admin/bookings" className="text-sm font-semibold text-sky-600 hover:underline">All bookings</Link>
      </div>
      {latest.length === 0 ? <Panel className="p-6 text-center text-ink-soft">No bookings yet.</Panel> : (
        <Table>
          <thead><tr><th className={th}>Reference</th><th className={th}>Customer</th><th className={th}>Trip</th><th className={th}>Total</th><th className={th}>Status</th></tr></thead>
          <tbody>
            {latest.map((b) => (
              <tr key={b.reference}>
                <td className={td}><Link href={`/admin/bookings/${b.reference}`} className="font-mono font-semibold text-sky-600 hover:underline">{b.reference}</Link></td>
                <td className={td}>{b.user.email}</td>
                <td className={td}>{b.package?.title ?? b.groupTrip?.title ?? "—"}</td>
                <td className={`${td} tabular`}>{formatINR(b.total / 100)}</td>
                <td className={td}><BookingStatus status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
