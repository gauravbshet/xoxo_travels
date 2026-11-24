import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/components/ui";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { RespondButtons, SafetyMenu, WithdrawButton } from "@/components/partners/partner-buttons";
import { Avatar, PersonLine } from "@/components/partners/person";
import { clerkEnabled } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requestsFor } from "@/lib/partners";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Partner requests", robots: { index: false } };

export default function RequestsPage() {
  if (!clerkEnabled) return <PagePlaceholder title="Partner requests" blurb="Add your Clerk keys to sign in." step="setup" />;
  return (
    <div className="container-x mx-auto max-w-3xl py-10 sm:py-14">
      <p className="mb-2 text-sm"><Link href="/partners" className="text-sky-600 hover:underline">← Find a partner</Link></p>
      <PageHeader eyebrow="Find a partner" title="Requests" blurb="Accepting opens a private chat. Declining isn't announced to the sender." />
      <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}><Lists /></Suspense>
    </div>
  );
}

async function Lists() {
  const user = await getCurrentUser();
  if (!user) return <p className="text-ink-soft">Sign in to see your requests.</p>;
  const { incoming, sent } = await requestsFor(user.id);
  return (
    <div className="space-y-10">
      <section aria-labelledby="in-h">
        <h2 id="in-h" className="mb-3 text-xl">Incoming <span className="text-ink-mute">({incoming.length})</span></h2>
        {incoming.length === 0 ? <p className="rounded-xl border border-dashed border-line bg-paper p-6 text-center text-ink-soft">No requests right now.</p> : (
          <ul className="space-y-3">
            {incoming.map((r) => (
              <li key={r.id} className="rounded-xl border border-line/70 bg-paper p-5 shadow-card">
                <div className="flex items-start gap-4">
                  <Avatar url={r.person.photoUrl} name={r.person.name} />
                  <div className="min-w-0 flex-1">
                    <PersonLine {...r.person} />
                    <p className="text-xs text-ink-mute">Sent {formatDate(r.createdAt)}</p>
                    {r.message && <p className="mt-2 text-sm text-ink">&ldquo;{r.message}&rdquo;</p>}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <RespondButtons id={r.id} />
                  <SafetyMenu userId={r.person.userId} name={r.person.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="out-h">
        <h2 id="out-h" className="mb-3 text-xl">Sent <span className="text-ink-mute">({sent.length})</span></h2>
        {sent.length === 0 ? <p className="rounded-xl border border-dashed border-line bg-paper p-6 text-center text-ink-soft">You haven&apos;t sent any requests.</p> : (
          <ul className="space-y-3">
            {sent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 bg-paper p-4 shadow-card">
                <div className="flex items-center gap-3"><Avatar url={r.person.photoUrl} name={r.person.name} size="sm" /><PersonLine {...r.person} /></div>
                {r.status === "pending" ? <WithdrawButton id={r.id} /> : <span className="text-sm text-ink-mute">Not available</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
