import type { Metadata } from "next";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { privateViewUrl, publicUrl } from "@/lib/storage";
import { ageOn } from "@/lib/profile";
import { AdminHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { ReviewButtons } from "@/components/admin/review-buttons";
import { Badge } from "@/components/ui";
import { idDocumentTypes, uploads } from "@/config/profile";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Verifications" };

const docLabel = (v: string) => idDocumentTypes.find((d) => d.value === v)?.label ?? v;

export default async function AdminVerifications() {
  await adminOr404();
  const [pending, recent] = await Promise.all([
    db!.verification.findMany({
      where: { status: "pending" }, orderBy: { createdAt: "asc" }, take: 50,
      select: { id: true, documentKey: true, documentType: true, createdAt: true, user: { select: { email: true, profile: { select: { displayName: true, avatarKey: true, city: true, dateOfBirth: true } } } } },
    }),
    db!.verification.findMany({
      where: { status: { not: "pending" } }, orderBy: { reviewedAt: "desc" }, take: 20,
      select: { id: true, status: true, note: true, documentType: true, reviewedBy: true, reviewedAt: true, user: { select: { email: true, profile: { select: { displayName: true } } } } },
    }),
  ]);
  // Short-lived links, made fresh on each page load. Never stored or logged.
  const links = await Promise.all(pending.map((v) => (v.documentKey ? privateViewUrl(v.documentKey, uploads.viewUrlTtl) : null)));

  return (
    <>
      <AdminHeader title="ID verifications" blurb={`${pending.length} waiting. Document links expire after ${uploads.viewUrlTtl / 60} minutes; reload for fresh ones. Files are deleted after review.`} />

      {pending.length === 0 ? <Panel className="mb-8 p-6 text-center text-ink-soft">Nothing to review.</Panel> : (
        <ul className="mb-10 space-y-3">
          {pending.map((v, i) => {
            const p = v.user.profile;
            return (
              <li key={v.id}>
                <Panel className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-center gap-4">
                    <div className="size-14 shrink-0 overflow-hidden rounded-pill bg-sky-100">
                      {/* eslint-disable-next-line @next/next/no-img-element -- user uploads come from storage, not a configured image host */}
                      {p?.avatarKey ? <img src={publicUrl(p.avatarKey)} alt="" className="size-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-ink">{p?.displayName ?? "—"} <span className="font-normal text-ink-soft">· {v.user.email}</span></p>
                      <p className="text-ink-soft">{[p?.city, p?.dateOfBirth ? `${ageOn(p.dateOfBirth.toISOString())} yrs` : null].filter(Boolean).join(" · ") || "Profile incomplete"}</p>
                      <p className="mt-1"><Badge>{docLabel(v.documentType)}</Badge> <span className="text-ink-mute">submitted {formatDate(v.createdAt.toISOString())}</span></p>
                      {links[i] && <a href={links[i]!} target="_blank" rel="noreferrer noopener" className="mt-1 inline-block font-semibold text-sky-600 hover:underline">View document</a>}
                    </div>
                  </div>
                  <div className="sm:w-72"><ReviewButtons id={v.id} /></div>
                </Panel>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mb-3 text-lg">Recently reviewed</h2>
      {recent.length === 0 ? <Panel className="p-6 text-center text-ink-soft">No reviews yet.</Panel> : (
        <Table>
          <thead><tr><th className={th}>Traveler</th><th className={th}>Document</th><th className={th}>Decision</th><th className={th}>Reviewed</th></tr></thead>
          <tbody>
            {recent.map((v) => (
              <tr key={v.id}>
                <td className={td}>{v.user.profile?.displayName ?? "—"}<p className="text-xs text-ink-mute">{v.user.email}</p></td>
                <td className={td}>{docLabel(v.documentType)}</td>
                <td className={td}><Badge tone={v.status === "approved" ? "green" : "coral"}>{v.status === "approved" ? "Verified" : "Rejected"}</Badge>{v.note && <p className="mt-1 text-xs text-ink-soft">{v.note}</p>}</td>
                <td className={td}>{v.reviewedAt ? formatDate(v.reviewedAt.toISOString()) : "—"}<p className="text-xs text-ink-mute">{v.reviewedBy}</p></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
