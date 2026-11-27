import type { Metadata } from "next";
import { Suspense } from "react";
import { Button, EmptyState, Photo, Skeleton } from "@/components/ui";
import { BookingStatus } from "@/components/bookings/booking-status";
import { PayNowButton } from "@/components/checkout/pay-panel";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getBookingForUser, type BookingView } from "@/lib/data/bookings";
import { booking as rules } from "@/config/booking";
import { formatDate, formatDateRange, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Booking confirmation", robots: { index: false } };

export default function ConfirmationPage({ searchParams }: PageProps<"/checkout/confirmation">) {
  return (
    <div className="container-x pb-16 pt-8 sm:pt-12">
      <Suspense fallback={<Skeleton className="mx-auto h-[32rem] max-w-2xl rounded-xl" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const dates = (b: BookingView) => (b.startDate && b.endDate ? formatDateRange(b.startDate, b.endDate) : b.startDate ? formatDate(b.startDate) : "");

async function Content({ searchParams }: { searchParams: PageProps<"/checkout/confirmation">["searchParams"] }) {
  const sp = await searchParams;
  const ref = typeof sp.ref === "string" && /^XO-[A-Z0-9]{6}$/.test(sp.ref) ? sp.ref : null;
  const user = await getCurrentUser();
  const b = ref && user ? await getBookingForUser(user.id, ref) : null;
  if (!b) return <EmptyState title="We couldn't find that booking" blurb="Check the link, or find it in your bookings." action={{ label: "My bookings", href: "/account/bookings" }} />;

  const confirmed = b.status === "confirmed" || b.status === "completed";
  return (
    <article className="mx-auto max-w-2xl">
      <header className="text-center">
        {confirmed ? (
          <span className="mx-auto grid size-14 place-items-center rounded-pill bg-leaf-600 text-white" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        ) : <BookingStatus status={b.status} />}
        <h1 className="mt-4 text-3xl sm:text-4xl">{confirmed ? "You're booked" : b.status === "pending" ? "Payment not finished" : "Booking details"}</h1>
        <p className="mt-2 text-ink-soft">
          {confirmed ? <>We&apos;ve emailed the details to <strong className="text-ink">{b.contact.email || "your account email"}</strong>.</>
            : b.status === "pending" ? "Your booking is saved. Pay to confirm it." : null}
        </p>
        <p className="mt-5 text-sm text-ink-mute">Booking reference</p>
        <p className="font-display text-3xl font-extrabold tracking-wide text-ink tabular">{b.reference}</p>
      </header>

      <div className="mt-8 overflow-hidden rounded-xl border border-line/70 bg-paper shadow-card">
        <div className="flex gap-4 p-5">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-cream-deep">
            {b.image.src && <Photo src={b.image.src} alt={b.image.alt} fill sizes="80px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-mute">{b.destinationName}</p>
            <h2 className="mt-0.5 text-lg leading-snug">{b.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{dates(b)} · {b.travelers} {b.travelers === 1 ? "traveler" : "travelers"}{b.leader ? ` · with ${b.leader}` : ""}</p>
          </div>
        </div>

        <dl className="grid gap-x-6 gap-y-3 border-t border-line/70 p-5 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-mute">Lead traveler</dt><dd className="font-semibold text-ink">{b.contact.name}</dd></div>
          <div><dt className="text-ink-mute">Phone</dt><dd className="font-semibold text-ink">{b.contact.phone}</dd></div>
          {b.people.length > 1 && (
            <div className="sm:col-span-2"><dt className="text-ink-mute">Travelers</dt><dd className="font-semibold text-ink">{b.people.map((p) => `${p.name} (${p.age})`).join(", ")}</dd></div>
          )}
        </dl>

        <dl className="space-y-1.5 border-t border-line/70 p-5 text-sm">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tabular">{formatINR(b.subtotal)}</dd></div>
          {b.discount > 0 && <div className="flex justify-between"><dt className="text-ink-soft">Coupon{b.couponCode ? ` ${b.couponCode}` : ""}</dt><dd className="tabular text-leaf-700">−{formatINR(b.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-ink-soft">{rules.gstLabel}</dt><dd className="tabular">{formatINR(b.tax)}</dd></div>
          <div className="flex justify-between pt-1.5 text-base font-bold"><dt>{confirmed ? "Paid" : "Total"}</dt><dd className="tabular">{formatINR(b.total)}</dd></div>
          {b.paidAt && <p className="pt-1 text-xs text-ink-mute">Paid on {formatDate(b.paidAt)}{b.paymentMethod && b.paymentMethod !== "mock" ? ` by ${b.paymentMethod}` : ""}</p>}
        </dl>

        {b.status === "pending" && <div className="border-t border-line/70 p-5"><PayNowButton reference={b.reference} total={b.total} /></div>}
      </div>

      {confirmed && (
        <section aria-labelledby="next-h" className="mt-8">
          <h2 id="next-h" className="text-xl">What happens next</h2>
          <ol className="mt-3 space-y-2 text-[15px] text-ink-soft">
            <li>1. We send your vouchers and meeting details by email before departure.</li>
            <li>2. Carry a government photo ID for every traveler.</li>
            <li>3. Questions? Reply to the confirmation email with your reference.</li>
          </ol>
          <h3 className="mt-6 text-base">Cancellation</h3>
          <ul className="mt-2 space-y-1 text-sm text-ink-soft">{rules.cancellation.map((c) => <li key={c.label}>{c.label}: <span className="font-semibold text-ink">{c.outcome}</span></li>)}</ul>
        </section>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {confirmed && <Button href={`/account/bookings/${b.reference}/invoice`} variant="outline" className="flex-1">GST invoice</Button>}
        <Button href="/account/bookings" variant="outline" className="flex-1">My bookings</Button>
        <Button href={b.href} variant="outline" className="flex-1">View the trip</Button>
      </div>
    </article>
  );
}
