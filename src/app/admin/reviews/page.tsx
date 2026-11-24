import type { Metadata } from "next";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { ReviewModeration } from "@/components/admin/moderation-buttons";
import { Badge, FilterChips } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviews({ searchParams }: PageProps<"/admin/reviews">) {
  await adminOr404();
  const sp = await searchParams;
  const show = sp.show === "approved" ? "approved" : "pending";
  const rows = await db!.review.findMany({
    where: { approved: show === "approved" }, orderBy: { createdAt: show === "pending" ? "asc" : "desc" }, take: 50,
    include: { user: { select: { email: true, profile: { select: { displayName: true } } } }, package: { select: { title: true } }, booking: { select: { reference: true } } },
  });
  const pendingCount = await db!.review.count({ where: { approved: false } });
  const params = new URLSearchParams(show === "approved" ? { show } : {});

  return (
    <>
      <AdminHeader title="Reviews" blurb={`${pendingCount} waiting for approval. Only approved reviews appear on the site and count toward ratings.`} />
      <Panel className="mb-4 px-4 sm:px-5">
        <FilterChips label="Show" param="show" base="/admin/reviews" params={params} current={show === "approved" ? "approved" : undefined}
          chips={[{ label: "Waiting" }, { label: "Approved", value: "approved" }]} />
      </Panel>
      {rows.length === 0 ? <Panel className="p-6 text-center text-ink-soft">{show === "pending" ? "Nothing to review." : "No approved reviews yet."}</Panel> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Panel className="space-y-2 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="flex" role="img" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, n) => <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={n < r.rating ? "text-sun-500" : "text-line"}><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6L5.8 21l1.4-7L2 9.3l7-.8L12 2Z" /></svg>)}
                  </span>
                  <strong>{r.package.title}</strong>
                  <span className="text-ink-soft">by {r.user.profile?.displayName ?? "—"} · {r.user.email}</span>
                  <span className="text-ink-mute">· {r.booking.reference} · {formatDate(r.createdAt.toISOString())}</span>
                  {r.featured && <Badge tone="blue">Featured</Badge>}
                </div>
                <p className="text-[15px] text-ink">{r.text}</p>
                <ReviewModeration id={r.id} approved={r.approved} featured={r.featured} />
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
