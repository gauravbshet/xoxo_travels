import type { Metadata } from "next";
import { Suspense } from "react";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { AuthSetupNotice } from "@/components/auth/auth-setup-notice";
import { clerkEnabled, authPaths } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/current-user";
import { parseRef, resolveItem } from "@/lib/checkout";
import { formatDate, formatDateRange, formatDuration } from "@/lib/format";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  return (
    <div className="container-x pb-16 pt-6 sm:pt-8">
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CheckoutContent({ searchParams }: { searchParams: PageProps<"/checkout">["searchParams"] }) {
  const sp = await searchParams;
  const ref = parseRef(sp);
  if (!ref) {
    return <EmptyState title="Nothing to check out yet" blurb="Pick a holiday or a group trip, then choose your date and travelers." action={{ label: "Browse holidays", href: "/holidays" }} />;
  }
  if (!clerkEnabled) return <div className="flex justify-center"><AuthSetupNotice /></div>;

  const user = await getCurrentUser();
  if (!user) {
    const back = `/checkout?${new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : []))).toString()}`;
    return (
      <div className="mx-auto max-w-md rounded-xl border border-line/70 bg-paper p-8 text-center">
        <h1 className="text-2xl">Sign in to book</h1>
        <p className="mt-2 text-ink-soft">Sign in or create an account to finish your booking. Your choices are kept.</p>
        <Button href={`${authPaths.signIn}?redirect_url=${encodeURIComponent(back)}`} size="lg" className="mt-6 w-full">Sign in</Button>
      </div>
    );
  }

  const res = await resolveItem(ref);
  if (!res.ok) return <EmptyState title="We can't book this as chosen" blurb={res.message} action={{ label: "Go back", href: res.backHref }} />;
  const it = res.item;
  const displayName = user.profile?.displayName;

  return (
    <>
      <CheckoutForm
        item={{
          kind: it.kind, slug: it.slug, title: it.title, image: it.image, destinationName: it.destinationName,
          perPerson: it.perPerson, travelers: it.travelers, date: it.date,
          dateLabel: it.endDate ? formatDateRange(it.date, it.endDate) : formatDate(it.date),
          durationLabel: formatDuration(it.nights, it.days), leader: it.leader,
          backHref: it.kind === "package" ? `/holidays/${it.slug}` : `/group-trips/${it.slug}`,
        }}
        account={{
          name: displayName && displayName !== "Traveler" ? displayName : "",
          email: user.email.endsWith("@placeholder.invalid") ? "" : user.email,
          phone: user.phone ?? "",
        }}
      />
    </>
  );
}

function CheckoutSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading checkout">
      <Skeleton className="mb-6 h-10 w-48" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <div className="space-y-8"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
        <Skeleton className="h-[30rem] rounded-xl" />
      </div>
    </div>
  );
}
