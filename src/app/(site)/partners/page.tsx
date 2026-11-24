import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge, Button, FilterChips, PageHeader, Skeleton } from "@/components/ui";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { TripForm } from "@/components/partners/trip-form";
import { DiscoverableToggle, EndTripButton, RequestButton, SafetyMenu } from "@/components/partners/partner-buttons";
import { Avatar, PersonLine } from "@/components/partners/person";
import { clerkEnabled } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { findMatches, myTrips, partnerStatus } from "@/lib/partners";
import { partners as rules } from "@/config/partners";
import { formatDateRange } from "@/lib/format";
import { pageMeta } from "@/lib/metadata";

export const metadata: Metadata = { ...pageMeta({ title: "Find a travel partner", description: "Meet travelers heading to the same place on the same dates, within 200 km of you.", path: "/partners" }), robots: { index: false } };

const missingLabel: Record<string, string> = { displayName: "display name", photo: "photo", city: "city", dateOfBirth: "date of birth", gender: "gender" };

export default function PartnersPage({ searchParams }: PageProps<"/partners">) {
  if (!clerkEnabled) return <PagePlaceholder title="Find a travel partner" blurb="Add your Clerk keys to sign in and use Find a Partner." step="setup" />;
  return (
    <div className="container-x py-10 sm:py-14">
      <Suspense fallback={<div className="space-y-4"><Skeleton className="h-12 w-72" /><Skeleton className="h-80 rounded-xl" /></div>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/partners">["searchParams"] }) {
  const [sp, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (!user || !db) return <p className="text-ink-soft">Connect the database to use Find a Partner.</p>;
  const status = await partnerStatus(user.id);

  const header = (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <PageHeader eyebrow="Find a partner" title="Travel with someone" blurb={`Same destination, overlapping dates, within ${rules.radiusKm} km of you. Chat opens once both say yes.`} />
      <div className="flex gap-2 sm:mb-8">
        <Button href="/partners/requests" variant="outline" size="sm">Requests</Button>
        <Button href="/chat" variant="outline" size="sm">Messages</Button>
      </div>
    </div>
  );

  if (!status.ready) {
    return (
      <>
        {header}
        <div className="max-w-xl space-y-4 rounded-xl border border-line/70 bg-paper p-6 shadow-card">
          <h2 className="text-xl">Before you start</h2>
          {status.missing.length > 0 ? (
            <>
              <p className="text-ink-soft">Add your <strong className="text-ink">{status.missing.map((m) => missingLabel[m]).join(", ")}</strong> so other travelers know who they&apos;re meeting.</p>
              <Button href="/account/profile">Finish my profile</Button>
            </>
          ) : <DiscoverableToggle on={status.discoverable} canEnable />}
        </div>
      </>
    );
  }

  const [trips, destinations] = await Promise.all([
    myTrips(user.id),
    db.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const selected = trips.find((t) => t.id === sp.trip) ?? trips[0];
  const gender = sp.gender === "female" || sp.gender === "male" ? sp.gender : undefined;
  const matches = selected ? await findMatches(user.id, selected.id, gender) : null;
  const params = new URLSearchParams();
  if (selected) params.set("trip", selected.id);
  if (gender) params.set("gender", gender);
  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <>
      {header}
      <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
        {/* Phones: once there's a trip, matches come first; trips and the form follow. */}
        <aside className={`space-y-6 lg:order-none ${trips.length ? "order-2" : ""}`}>
          <section className="rounded-xl border border-line/70 bg-paper p-5 shadow-card">
            <h2 className="text-lg">Your trips</h2>
            {trips.length === 0 ? <p className="mt-1 text-sm text-ink-soft">Add a trip to see who else is going.</p> : (
              <ul className="mt-3 space-y-2">
                {trips.map((t) => (
                  <li key={t.id} className={`rounded-lg border p-3 ${t.id === selected?.id ? "border-sky-600 bg-sky-50" : "border-line/70"}`}>
                    <Link href={`/partners?trip=${t.id}`} className="block font-semibold text-ink hover:text-sky-700" aria-current={t.id === selected?.id ? "true" : undefined}>{t.destination}</Link>
                    <p className="text-sm text-ink-soft">{formatDateRange(t.startDate, t.endDate)}</p>
                    <div className="mt-1"><EndTripButton id={t.id} /></div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {trips.length < rules.maxActiveTrips && (
            <section className="rounded-xl border border-line/70 bg-paper p-5 shadow-card">
              <h2 className="mb-4 text-lg">Add a trip</h2>
              <TripForm destinations={destinations} minDate={minDate} />
            </section>
          )}
          <section className="rounded-xl border border-line/70 bg-paper p-5 shadow-card"><DiscoverableToggle on canEnable /></section>
        </aside>

        <section aria-labelledby="matches-h" className={`min-w-0 lg:order-none ${trips.length ? "order-1" : ""}`}>
          {!selected ? (
            <div className="rounded-xl border border-dashed border-line bg-paper p-10 text-center">
              <h2 id="matches-h" className="text-2xl">No trips yet</h2>
              <p className="mt-2 text-ink-soft">Add where you&apos;re going and when. We&apos;ll show travelers on the same trip near you.</p>
            </div>
          ) : (
            <>
              <h2 id="matches-h" className="text-2xl">Going to {selected.destination}</h2>
              <p className="mt-1 text-sm text-ink-soft">{formatDateRange(selected.startDate, selected.endDate)} · within {rules.radiusKm} km of you</p>
              <div className="my-4 rounded-xl border border-line/70 bg-paper px-4">
                <FilterChips label="Show" param="gender" base="/partners" params={params} current={gender}
                  chips={[{ label: "Everyone" }, { label: "Women only", value: "female" }, { label: "Men only", value: "male" }]} />
              </div>
              {!matches || matches.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-paper p-10 text-center">
                  <p className="font-semibold text-ink">No matches yet</p>
                  <p className="mt-1 text-sm text-ink-soft">New travelers join every day. Check back soon, or widen your dates.</p>
                </div>
              ) : (
                <ul className="grid gap-4 xl:grid-cols-2">
                  {matches.map((m) => (
                    <li key={m.userId} className="flex flex-col rounded-xl border border-line/70 bg-paper p-5 shadow-card">
                      <div className="flex items-start gap-4">
                        <Avatar url={m.photoUrl} name={m.name} />
                        <div className="min-w-0 flex-1">
                          <PersonLine name={m.name} age={m.age} city={m.city} verified={m.verified} />
                          <p className="mt-0.5 text-xs font-semibold text-ink-mute">{m.distance} · together {formatDateRange(m.overlap.start, m.overlap.end)}</p>
                        </div>
                      </div>
                      {m.note && <p className="mt-3 text-sm text-ink">&ldquo;{m.note}&rdquo;</p>}
                      {m.bio && !m.note && <p className="mt-3 line-clamp-3 text-sm text-ink-soft">{m.bio}</p>}
                      {(m.sharedInterests.length > 0 || m.sharedLanguages.length > 0) && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {m.sharedInterests.map((i) => <Badge key={i} tone="blue">{i}</Badge>)}
                          {m.sharedLanguages.map((l) => <Badge key={l}>{l}</Badge>)}
                        </div>
                      )}
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                        <RequestButton toId={m.userId} name={m.name} state={m.state} conversationId={m.conversationId} />
                        <SafetyMenu userId={m.userId} name={m.name} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
