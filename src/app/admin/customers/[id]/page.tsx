import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { VisibilityButton } from "@/components/admin/moderation-buttons";
import { BookingStatus } from "@/components/bookings/booking-status";
import { Avatar } from "@/components/partners/person";
import { Badge } from "@/components/ui";
import { ageOn } from "@/lib/profile";
import { publicUrl } from "@/lib/storage";
import { profile as profileRules } from "@/config/profile";
import { partners } from "@/config/partners";
import { formatDate, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Customer" };

export default async function AdminCustomer({ params }: PageProps<"/admin/customers/[id]">) {
  await adminOr404();
  const u = await db!.user.findUnique({
    where: { id: (await params).id },
    include: {
      profile: true,
      bookings: { orderBy: { createdAt: "desc" }, take: 20, select: { reference: true, status: true, total: true, createdAt: true, package: { select: { title: true } }, groupTrip: { select: { title: true } } } },
      verifications: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, status: true, documentType: true, createdAt: true, note: true } },
      reportsGot: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, reason: true, details: true, resolved: true, createdAt: true, reporter: { select: { email: true } } } },
      _count: { select: { reportsMade: true, partnerTrips: true, sentRequests: true } },
    },
  });
  if (!u) notFound();
  const p = u.profile;
  const gender = profileRules.genders.find((g) => g.value === p?.gender)?.label;
  const reason = (v: string) => partners.reportReasons.find((r) => r.value === v)?.label ?? v;

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/customers" className="text-sky-600 hover:underline">← All customers</Link></p>
      <AdminHeader title={p?.displayName ?? u.email} blurb={`${u.email} · joined ${formatDate(u.createdAt.toISOString())}`} />
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Panel className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <Avatar url={p?.avatarKey ? publicUrl(p.avatarKey) : null} name={p?.displayName ?? "?"} />
            <div className="text-sm">
              <p className="font-semibold text-ink">{p?.displayName ?? "No profile"}</p>
              <p className="text-ink-soft">{[p?.dateOfBirth ? `${ageOn(p.dateOfBirth.toISOString())} yrs` : null, gender, p?.city].filter(Boolean).join(" · ") || "Profile incomplete"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {u.role === "admin" && <Badge tone="blue">Admin</Badge>}
            {p?.verified ? <Badge tone="trust">Verified</Badge> : <Badge>Not verified</Badge>}
            {p?.discoverable ? <Badge>In Find a Partner</Badge> : <Badge tone="neutral">Hidden</Badge>}
          </div>
          {p?.bio && <p className="text-sm text-ink-soft">{p.bio}</p>}
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-ink-mute">Phone</dt><dd>{u.phone ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-mute">Partner trips</dt><dd>{u._count.partnerTrips}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-mute">Requests sent</dt><dd>{u._count.sentRequests}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-mute">Reports made</dt><dd>{u._count.reportsMade}</dd></div>
          </dl>
          {p && <VisibilityButton userId={u.id} discoverable={p.discoverable} />}
        </Panel>

        <div className="min-w-0 space-y-6">
          <section>
            <h2 className="mb-3 text-lg">Bookings</h2>
            {u.bookings.length === 0 ? <Panel className="p-6 text-center text-ink-soft">No bookings.</Panel> : (
              <Table>
                <thead><tr><th className={th}>Reference</th><th className={th}>Trip</th><th className={th}>Total</th><th className={th}>Status</th></tr></thead>
                <tbody>{u.bookings.map((b) => (
                  <tr key={b.reference}>
                    <td className={td}><Link href={`/admin/bookings/${b.reference}`} className="font-mono font-semibold text-sky-600 hover:underline">{b.reference}</Link><p className="text-xs text-ink-mute">{formatDate(b.createdAt.toISOString())}</p></td>
                    <td className={td}>{b.package?.title ?? b.groupTrip?.title ?? "—"}</td>
                    <td className={`${td} tabular`}>{formatINR(b.total / 100)}</td>
                    <td className={td}><BookingStatus status={b.status} /></td>
                  </tr>
                ))}</tbody>
              </Table>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-lg">Reports against this traveler</h2>
            {u.reportsGot.length === 0 ? <Panel className="p-6 text-center text-ink-soft">None.</Panel> : (
              <ul className="space-y-2">{u.reportsGot.map((r) => (
                <li key={r.id}><Panel className="p-4 text-sm">
                  <p><Badge tone={r.resolved ? "neutral" : "coral"}>{reason(r.reason)}</Badge> <span className="text-ink-mute">by {r.reporter.email} · {formatDate(r.createdAt.toISOString())}{r.resolved ? " · resolved" : ""}</span></p>
                  {r.details && <p className="mt-1 text-ink">{r.details}</p>}
                </Panel></li>
              ))}</ul>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-lg">ID verification</h2>
            {u.verifications.length === 0 ? <Panel className="p-6 text-center text-ink-soft">Never submitted.</Panel> : (
              <ul className="space-y-2">{u.verifications.map((v) => (
                <li key={v.id}><Panel className="p-4 text-sm">
                  <Badge tone={v.status === "approved" ? "green" : v.status === "rejected" ? "coral" : "yellow"}>{v.status}</Badge> <span className="text-ink-mute">{v.documentType} · {formatDate(v.createdAt.toISOString())}</span>
                  {v.note && <p className="mt-1 text-ink-soft">{v.note}</p>}
                </Panel></li>
              ))}</ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
