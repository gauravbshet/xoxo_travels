import type { Metadata } from "next";
import { Suspense } from "react";
import { Button, VerifiedBadge } from "@/components/ui";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { clerkEnabled } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getProfileView } from "@/lib/profile";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

async function AccountSummary() {
  const user = await getCurrentUser();
  if (!user) {
    return <p className="mt-3 text-ink-soft">Your account details load once the database is connected.</p>;
  }
  const p = await getProfileView(user.id);
  const email = user.email.endsWith("@placeholder.invalid") ? "No email on file" : user.email;
  const name = p?.displayName || "Traveler";
  return (
    <div className="mt-6 rounded-xl border border-line/70 bg-paper p-5 text-left shadow-card">
      <div className="flex items-center gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-pill bg-sky-100">
          {p?.photoUrl
            // eslint-disable-next-line @next/next/no-img-element -- user uploads come from storage, not a configured image host
            ? <img src={p.photoUrl} alt="" className="size-full object-cover" />
            : <span className="grid size-full place-items-center font-display text-xl font-bold text-sky-700" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-display text-xl font-bold text-ink">{name}{p?.verified && <VerifiedBadge />}</p>
          <p className="break-all text-sm text-ink-soft">{email}</p>
          {p?.city && <p className="text-sm text-ink-soft">{p.city}</p>}
        </div>
      </div>
      {p && p.missing.length > 0 && <p className="mt-4 rounded-lg bg-sun-50 px-3 py-2 text-sm text-ink">Your profile is incomplete. Finish it to use Find a Partner.</p>}
    </div>
  );
}

export default function AccountPage() {
  if (!clerkEnabled) {
    return <PagePlaceholder title="My account" blurb="Add your Clerk keys to sign in and see your account here." step="setup" />;
  }
  return (
    <div className="container-x mx-auto max-w-2xl py-16 text-center">
      <h1 className="text-4xl sm:text-5xl">My account</h1>
      <p className="mt-3 text-ink-soft">Your profile, bookings and verification in one place.</p>
      <Suspense fallback={<div className="skeleton mt-6 h-24 w-full" />}>
        <AccountSummary />
      </Suspense>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button href="/account/profile">Edit profile</Button>
        <Button href="/account/bookings" variant="outline">My bookings</Button>
        <Button href="/chat" variant="outline">Messages</Button>
        <Button href="/" variant="outline">Back to home</Button>
      </div>
    </div>
  );
}
