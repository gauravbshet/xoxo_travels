import type { Metadata } from "next";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { ReportButtons } from "@/components/admin/report-buttons";
import { Badge } from "@/components/ui";
import { partners } from "@/config/partners";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

const reasonLabel = (v: string) => partners.reportReasons.find((r) => r.value === v)?.label ?? v;
const who = { email: true, profile: { select: { displayName: true, discoverable: true, verified: true } } } as const;

export default async function AdminReports() {
  await adminOr404();
  const [open, done] = await Promise.all([
    db!.report.findMany({ where: { resolved: false }, orderBy: { createdAt: "asc" }, take: 50, include: { reporter: { select: who }, reported: { select: { id: true, ...who } } } }),
    db!.report.findMany({ where: { resolved: true }, orderBy: { createdAt: "desc" }, take: 20, include: { reporter: { select: who }, reported: { select: who } } }),
  ]);
  // How often each reported person has been reported, to spot repeat problems.
  const counts = open.length
    ? await db!.report.groupBy({ by: ["reportedId"], where: { reportedId: { in: open.map((r) => r.reportedId) } }, _count: { _all: true } })
    : [];
  const countFor = (id: string) => counts.find((c) => c.reportedId === id)?._count._all ?? 1;

  return (
    <>
      <AdminHeader title="Reports" blurb={`${open.length} open. "Hide user" turns off their Find a Partner visibility. They can switch it back on, so for repeat abuse remove the account in Clerk.`} />
      {open.length === 0 ? <Panel className="mb-8 p-6 text-center text-ink-soft">No open reports.</Panel> : (
        <ul className="mb-10 space-y-3">
          {open.map((r) => (
            <li key={r.id}>
              <Panel className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="coral">{reasonLabel(r.reason)}</Badge>
                  {countFor(r.reportedId) > 1 && <Badge tone="yellow">Reported {countFor(r.reportedId)} times</Badge>}
                  <span className="text-xs text-ink-mute">{formatDate(r.createdAt.toISOString())}</span>
                </div>
                <p className="text-sm"><span className="text-ink-mute">Reported:</span> <strong>{r.reported.profile?.displayName ?? "—"}</strong> · {r.reported.email}
                  {r.reported.profile?.verified && <> · <span className="text-leaf-700">verified</span></>}
                  {!r.reported.profile?.discoverable && <> · <span className="text-ink-mute">hidden</span></>}</p>
                <p className="text-sm"><span className="text-ink-mute">By:</span> {r.reporter.profile?.displayName ?? "—"} · {r.reporter.email}</p>
                {r.details && <p className="rounded-lg bg-cream-deep p-3 text-sm text-ink">{r.details}</p>}
                <ReportButtons id={r.id} name={r.reported.profile?.displayName ?? "this user"} />
              </Panel>
            </li>
          ))}
        </ul>
      )}
      <h2 className="mb-3 text-lg">Recently resolved</h2>
      {done.length === 0 ? <Panel className="p-6 text-center text-ink-soft">Nothing resolved yet.</Panel> : (
        <Table>
          <thead><tr><th className={th}>Reported</th><th className={th}>Reason</th><th className={th}>By</th><th className={th}>Resolved by</th></tr></thead>
          <tbody>
            {done.map((r) => (
              <tr key={r.id}>
                <td className={td}>{r.reported.profile?.displayName ?? "—"}<p className="text-xs text-ink-mute">{r.reported.email}</p></td>
                <td className={td}>{reasonLabel(r.reason)}</td>
                <td className={td}>{r.reporter.email}</td>
                <td className={td}>{r.resolvedBy}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
