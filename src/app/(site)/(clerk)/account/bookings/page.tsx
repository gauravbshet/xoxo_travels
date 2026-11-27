import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, PageHeader, Photo, Skeleton } from "@/components/ui";
import { BookingStatus } from "@/components/bookings/booking-status";
import { PayNowButton } from "@/components/checkout/pay-panel";
import { ReviewForm } from "@/components/bookings/review-form";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { clerkEnabled } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getBookingsForUser, type BookingView } from "@/lib/data/bookings";
import { formatDate, formatDateRange, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "My bookings", robots: { index: false } };

export default function BookingsPage() {
  if (!clerkEnabled) return <PagePlaceholder title="My bookings" blurb="Add your Clerk keys to sign in and see your bookings." step="setup" />;
  return (
    <div className="container-x py-10 sm:py-14">
      <PageHeader eyebrow="Account" title="My bookings" blurb="Every trip you've booked, newest first." />
      <Suspense fallback={<div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>}>
        <List />
      </Suspense>
    </div>
  );
}

const dates = (b: BookingView) => (b.startDate && b.endDate ? formatDateRange(b.startDate, b.endDate) : b.startDate ? formatDate(b.startDate) : "");

async function List() {
  const user = await getCurrentUser();
  if (!user) return <EmptyState title="Sign in to see your bookings" blurb="Your bookings are tied to your account." action={{ label: "Sign in", href: "/sign-in?redirect_url=/account/bookings" }} />;
  const bookings = await getBookingsForUser(user.id);
  if (bookings.length === 0) return <EmptyState title="No bookings yet" blurb="When you book a holiday or a group trip, it shows up here." action={{ label: "Browse holidays", href: "/holidays" }} />;

  return (
    <ul className="space-y-3">
      {bookings.map((b) => (
        <li key={b.id} className="rounded-xl border border-line/70 bg-paper p-4 shadow-card sm:p-5">
          <div className="flex gap-4">
            <div className="relative hidden size-20 shrink-0 overflow-hidden rounded-lg bg-cream-deep sm:block">
              {b.image.src && <Photo src={b.image.src} alt={b.image.alt} fill sizes="80px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <BookingStatus status={b.status} />
                <span className="font-mono text-xs font-semibold text-ink-mute">{b.reference}</span>
              </div>
              <h2 className="mt-1.5 text-lg leading-snug">
                <Link href={b.status === "expired" ? b.href : `/checkout/confirmation?ref=${b.reference}`} className="hover:text-sky-600">{b.title}</Link>
              </h2>
              <p className="mt-0.5 text-sm text-ink-soft">{dates(b)} · {b.travelers} {b.travelers === 1 ? "traveler" : "travelers"} · <span className="font-semibold text-ink">{formatINR(b.total)}</span></p>
              {b.status === "expired" && <p className="mt-1 text-sm text-ink-mute">The travel date passed before payment. Book again for a new date.</p>}
              {b.status === "cancelled" && <p className="mt-1 text-sm text-ink-mute">This booking was cancelled.</p>}
            </div>
          </div>
          {(b.status === "confirmed" || b.status === "completed" || b.status === "refunded") && (
            <div className="mt-3 border-t border-line/70 pt-3"><Link href={`/account/bookings/${b.reference}/invoice`} className="text-sm font-semibold text-sky-700 hover:underline">View GST invoice</Link></div>
          )}
          {b.status === "pending" && <div className="mt-4 border-t border-line/70 pt-4 sm:flex sm:justify-end"><PayNowButton reference={b.reference} total={b.total} /></div>}
          {b.reviewable && <div className="mt-4 border-t border-line/70 pt-4"><ReviewForm reference={b.reference} title={b.title} /></div>}
          {b.review && <p className="mt-3 border-t border-line/70 pt-3 text-sm text-ink-soft">{b.review.approved ? "Thanks, your review is live." : "Thanks, your review is waiting for a quick check."}</p>}
        </li>
      ))}
    </ul>
  );
}
