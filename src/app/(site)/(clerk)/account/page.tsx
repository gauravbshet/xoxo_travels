import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cn } from "@/lib/cn";
import { Button, Photo, Skeleton, VerifiedBadge } from "@/components/ui";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { BookingStatus } from "@/components/bookings/booking-status";
import { SignOut } from "@/components/account/sign-out";
import { clerkEnabled } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getProfileView } from "@/lib/profile";
import { getBookingsForUser, type BookingView } from "@/lib/data/bookings";
import { requestsFor } from "@/lib/partners";
import { conversationsFor } from "@/lib/chat";
import { formatDate, formatDateRange, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default function AccountPage() {
  if (!clerkEnabled) return <PagePlaceholder title="My account" blurb="Add your Clerk keys to sign in and see your account here." step="setup" />;
  return (
    <div className="container-x py-8 sm:py-10">
      <Suspense fallback={<DashboardSkeleton />}><Dashboard /></Suspense>
    </div>
  );
}

/* ───────── small pieces ───────── */

const icons = {
  plane: "M2 14l8-1 4 7 2-1-1-7 6-2a1.5 1.5 0 0 0 0-2.8L15 5l-5-3-2 1 3 5-7 2-2 3Z",
  suitcase: "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M4 7h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1ZM3 12h18",
  card: "M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM2 10h20M6 15h4",
  chat: "M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  users: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM21 19v-1a4 4 0 0 0-3-3.9M15.5 4.1a3 3 0 0 1 0 5.8",
  shield: "M12 3 5 6v6c0 4.4 3 7.8 7 9 4-1.2 7-4.6 7-9V6l-7-3ZM9 12l2 2 4-4",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4M12 17h.01",
  receipt: "M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3ZM10 8h4M10 12h4",
  check: "m5 12 5 5 9-10",
  arrow: "M5 12h14m-6-6 6 6-6 6",
};
function Icon({ d, className }: { d: string; className?: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("shrink-0", className)}><path d={d} /></svg>;
}

function Card({ title, action, children, className }: { title?: string; action?: { label: string; href: string }; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-line/70 bg-paper shadow-card", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-3.5">
          <h2 className="text-base font-bold text-ink sm:text-lg">{title}</h2>
          {action && <Link href={action.href} className="text-sm font-semibold text-sky-700 hover:underline">{action.label}</Link>}
        </div>
      )}
      {children}
    </section>
  );
}

const dates = (b: BookingView) => (b.startDate && b.endDate ? formatDateRange(b.startDate, b.endDate) : b.startDate ? formatDate(b.startDate) : "Date to be set");

/* ───────── dashboard ───────── */

async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) return <p className="text-ink-soft">Your account details load once the database is connected.</p>;
  const [p, bookings, requests, chats] = await Promise.all([
    getProfileView(user.id), getBookingsForUser(user.id), requestsFor(user.id), conversationsFor(user.id),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const paid = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");
  const upcoming = paid.filter((b) => b.status === "confirmed" && (b.endDate ?? b.startDate ?? today) >= today).sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
  const next = upcoming[0];
  const pending = bookings.filter((b) => b.status === "pending");
  const unread = chats.reduce((n, c) => n + c.unread, 0);
  const incoming = requests.incoming.length;
  const spent = paid.reduce((n, b) => n + b.total, 0);

  const name = p?.displayName || "Traveler";
  const email = user.email.endsWith("@placeholder.invalid") ? null : user.email;
  const memberSince = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(user.createdAt);
  const firstName = name.split(" ")[0];

  // Profile completeness: 5 required fields + bio, interests, languages and ID verification.
  const checks = p ? [p.displayName, p.photoUrl, p.city, p.dateOfBirth, p.gender, p.bio, p.interests.length, p.languages.length, p.verified] : [];
  const pct = checks.length ? Math.round((checks.filter(Boolean).length / checks.length) * 100) : 0;
  const missingLabel: Record<string, string> = { displayName: "Name", photo: "Photo", city: "City", dateOfBirth: "Date of birth", gender: "Gender" };

  const daysTo = next?.startDate ? Math.round((new Date(next.startDate).getTime() - new Date(today).getTime()) / 86_400_000) : null;

  // Things that need the traveler's attention, most urgent first.
  const todo: { text: string; href: string; tone: "coral" | "sun" | "sky" }[] = [
    ...pending.map((b) => ({ text: `Pay for ${b.title} (${formatINR(b.total)})`, href: "/account/bookings", tone: "coral" as const })),
    ...(incoming ? [{ text: `${incoming} partner ${incoming === 1 ? "request" : "requests"} waiting`, href: "/partners/requests", tone: "sky" as const }] : []),
    ...(unread ? [{ text: `${unread} unread ${unread === 1 ? "message" : "messages"}`, href: "/chat", tone: "sky" as const }] : []),
    ...(p && p.missing.length ? [{ text: `Finish your profile: add ${p.missing.map((m) => missingLabel[m].toLowerCase()).join(", ")}`, href: "/account/profile", tone: "sun" as const }] : []),
    ...(p && !p.verified && p.verification?.status !== "pending" ? [{ text: p.verification?.status === "rejected" ? "ID not verified, upload it again" : "Verify your ID for a trust badge", href: "/account/profile", tone: "sun" as const }] : []),
  ];
  const toneDot = { coral: "bg-coral-600", sun: "bg-sun-500", sky: "bg-sky-600" };

  const stats = [
    { label: "Upcoming trips", value: String(upcoming.length), href: "/account/bookings", icon: icons.plane },
    { label: "Trips booked", value: String(paid.length), href: "/account/bookings", icon: icons.suitcase },
    { label: "Awaiting payment", value: String(pending.length), href: "/account/bookings", icon: icons.card, alert: pending.length > 0 },
    { label: "Unread messages", value: String(unread), href: "/chat", icon: icons.chat, alert: unread > 0 },
  ];

  const links = [
    { label: "My bookings", sub: "Trips, payments, invoices", href: "/account/bookings", icon: icons.suitcase },
    { label: "Edit profile", sub: "Photo, details, ID", href: "/account/profile", icon: icons.user },
    { label: "Find a partner", sub: "Travel with others", href: "/partners", icon: icons.users },
    { label: "Messages", sub: "Your chats", href: "/chat", icon: icons.chat },
    { label: "Help centre", sub: "FAQs and contact", href: "/support", icon: icons.help },
  ];

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <section className="overflow-hidden rounded-xl border border-line/70 bg-paper shadow-card">
        <div className="relative bg-[linear-gradient(115deg,var(--color-ink)_0%,#141d33_60%,#1b2640_100%)] px-5 pb-14 pt-6 text-white sm:px-8">
          <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-sun-400/15 blur-3xl" />
          <p className="relative text-xs font-bold uppercase tracking-[0.16em] text-sun-400">My account</p>
          <h1 className="relative mt-1 text-2xl text-white sm:text-3xl">Welcome back, {firstName}</h1>
        </div>
        {/* Only the avatar overlaps the banner; name and details sit fully on the white card below it. */}
        <div className="px-5 pb-5 sm:px-8">
          <div className="flex items-end justify-between gap-3">
            <div className="relative -mt-10 size-20 shrink-0 overflow-hidden rounded-pill border-4 border-paper bg-sky-100 shadow-card sm:-mt-12 sm:size-24">
              {p?.photoUrl
                // eslint-disable-next-line @next/next/no-img-element -- user uploads come from storage, not a configured image host
                ? <img src={p.photoUrl} alt="" className="size-full object-cover" />
                : <span className="grid size-full place-items-center font-display text-3xl font-bold text-sky-700" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>}
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-3">
              <Button href="/account/profile" size="sm" className="h-10">Edit profile</Button>
              <SignOut />
            </div>
          </div>
          <div className="mt-3 min-w-0 space-y-1">
            <p className="flex flex-wrap items-center gap-2 break-words font-display text-xl font-bold leading-tight text-ink sm:text-2xl">{name}{p?.verified && <VerifiedBadge />}</p>
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-soft">
              {email && <span className="break-all">{email}</span>}
              {p?.city && <span>{p.city}</span>}
              <span className="text-ink-mute">Member since {memberSince}</span>
            </p>
          </div>
        </div>
        {p && (
          <div className="border-t border-line/70 px-5 py-4 sm:px-8">
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="font-semibold text-ink">Profile {pct}% complete</p>
              {pct < 100 && <Link href="/account/profile" className="font-semibold text-sky-700 hover:underline">Complete it</Link>}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-pill bg-cream-deep" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
              <div className={cn("h-full rounded-pill", pct === 100 ? "bg-sky-600" : "bg-sun-500")} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </section>

      {/* Stats */}
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="group flex h-full items-center gap-3 rounded-xl border border-line/70 bg-paper p-4 shadow-card transition-[transform,box-shadow] duration-base hover:-translate-y-0.5 hover:shadow-card-hover motion-reduce:hover:translate-y-0">
              <span className={cn("grid size-10 place-items-center rounded-md", s.alert ? "bg-coral-50 text-coral-700" : "bg-sky-50 text-sky-700")}><Icon d={s.icon} /></span>
              <span className="min-w-0">
                <span className="block font-display text-2xl font-extrabold leading-none tabular text-ink">{s.value}</span>
                <span className="mt-1 block truncate text-xs font-medium text-ink-soft">{s.label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          {/* Next trip */}
          <Card title="Your next trip" action={next ? { label: "All trips", href: "/account/bookings" } : undefined}>
            {next ? (
              <div className="grid sm:grid-cols-[14rem_minmax(0,1fr)]">
                <div className="relative h-40 bg-cream-deep sm:h-full">
                  {next.image.src && <Photo src={next.image.src} alt={next.image.alt} fill sizes="(min-width: 640px) 224px, 100vw" className="object-cover" />}
                  {daysTo !== null && (
                    <span className="absolute left-3 top-3 rounded-pill bg-ink/85 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                      {daysTo <= 0 ? "Happening now" : daysTo === 1 ? "Tomorrow" : `In ${daysTo} days`}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-mute">{next.destinationName}</p>
                  <p className="mt-0.5 font-display text-xl font-bold leading-snug text-ink">{next.title}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><dt className="text-ink-mute">Dates</dt><dd className="font-semibold text-ink">{dates(next)}</dd></div>
                    <div><dt className="text-ink-mute">Travelers</dt><dd className="font-semibold text-ink">{next.travelers}</dd></div>
                    <div><dt className="text-ink-mute">Reference</dt><dd className="font-mono font-semibold text-ink">{next.reference}</dd></div>
                    {next.leader && <div><dt className="text-ink-mute">Leader</dt><dd className="font-semibold text-ink">{next.leader}</dd></div>}
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button href={`/checkout/confirmation?ref=${next.reference}`} size="sm">View booking</Button>
                    <Button href={`/account/bookings/${next.reference}/invoice`} size="sm" variant="outline">GST invoice</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                <span className="grid size-12 place-items-center rounded-pill bg-sky-50 text-sky-700"><Icon d={icons.plane} /></span>
                <p className="font-semibold text-ink">No upcoming trips yet</p>
                <p className="max-w-sm text-sm text-ink-soft">Your next adventure is a few taps away.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button href="/holidays" size="sm">Browse holidays</Button>
                  <Button href="/group-trips" size="sm" variant="outline">Group trips</Button>
                </div>
              </div>
            )}
          </Card>

          {/* Recent bookings */}
          <Card title="Recent bookings" action={bookings.length ? { label: "View all", href: "/account/bookings" } : undefined}>
            {bookings.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-soft">You haven&apos;t booked anything yet.</p>
            ) : (
              <ul className="divide-y divide-line/70">
                {bookings.slice(0, 4).map((b) => (
                  <li key={b.id}>
                    <Link href={b.status === "expired" ? b.href : `/checkout/confirmation?ref=${b.reference}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-cream/60">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-cream-deep">
                        {b.image.src && <Photo src={b.image.src} alt="" fill sizes="48px" className="object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{b.title}</p>
                        <p className="truncate text-xs text-ink-soft">{dates(b)} · {b.reference}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-semibold tabular text-ink">{formatINR(b.total)}</span>
                        <BookingStatus status={b.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          {/* Needs attention */}
          <Card title="Needs your attention">
            {todo.length === 0 ? (
              <div className="flex items-center gap-3 px-5 py-5">
                <span className="grid size-9 place-items-center rounded-pill bg-sky-50 text-sky-700"><Icon d={icons.check} className="size-4" /></span>
                <p className="text-sm text-ink">You&apos;re all set. Nothing needs doing.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line/70">
                {todo.map((t) => (
                  <li key={t.text}>
                    <Link href={t.href} className="flex items-center gap-3 px-5 py-3.5 text-sm hover:bg-cream/60">
                      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", toneDot[t.tone])} />
                      <span className="min-w-0 flex-1 text-ink">{t.text}</span>
                      <Icon d={icons.arrow} className="size-4 text-ink-mute" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Spend summary */}
          {paid.length > 0 && (
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-mute">Total booked with us</p>
              <p className="mt-1 font-display text-3xl font-extrabold tabular text-ink">{formatINR(spent)}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft"><Icon d={icons.receipt} className="size-4" /> GST invoices are in My bookings</p>
            </Card>
          )}

          {/* Quick links */}
          <Card title="Quick links">
            <ul className="divide-y divide-line/70">
              {links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="flex items-center gap-3 px-5 py-3 hover:bg-cream/60">
                    <span className="grid size-9 place-items-center rounded-md bg-cream-deep text-ink"><Icon d={l.icon} className="size-[18px]" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-ink">{l.label}</span><span className="block text-xs text-ink-soft">{l.sub}</span></span>
                    <Icon d={icons.arrow} className="size-4 text-ink-mute" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your account">
      <Skeleton className="h-56 rounded-xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]"><Skeleton className="h-72 rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div>
    </div>
  );
}
