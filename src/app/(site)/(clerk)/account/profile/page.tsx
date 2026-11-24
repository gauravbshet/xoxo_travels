import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { PhotoUploader } from "@/components/profile/photo-uploader";
import { ProfileForm } from "@/components/profile/profile-form";
import { VerificationCard } from "@/components/profile/verification-card";
import { DiscoverableToggle } from "@/components/partners/partner-buttons";
import { clerkEnabled } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getProfileView } from "@/lib/profile";
import { profile as rules } from "@/config/profile";

export const metadata: Metadata = { title: "Your profile", robots: { index: false } };

const missingLabel: Record<(typeof rules.requiredForPartner)[number], string> = {
  displayName: "display name", photo: "photo", city: "city", dateOfBirth: "date of birth", gender: "gender",
};

export default function ProfilePage({ searchParams }: PageProps<"/account/profile">) {
  if (!clerkEnabled) return <PagePlaceholder title="Your profile" blurb="Add your Clerk keys to sign in and set up your profile." step="setup" />;
  return (
    <div className="container-x mx-auto max-w-3xl py-10 sm:py-14">
      <Suspense fallback={<div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-40 rounded-xl" /></div>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line/70 bg-paper p-5 shadow-card sm:p-6">
      <h2 className="text-xl">{title}</h2>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/account/profile">["searchParams"] }) {
  const [sp, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (!user) return <p className="text-ink-soft">Connect the database to set up profiles.</p>;
  const p = await getProfileView(user.id);
  if (!p) return <p className="text-ink-soft">Connect the database to set up profiles.</p>;
  const isNew = sp.new === "1";
  const maxDob = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - rules.minAge); return d.toISOString().slice(0, 10); })();

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/account" className="text-sky-600 hover:underline">← My account</Link></p>
      <h1 className="text-3xl sm:text-4xl">{isNew ? "Welcome! Set up your profile" : "Your profile"}</h1>
      <p className="mt-2 text-ink-soft">{isNew ? "A few details help other travelers know who they're meeting." : "Keep your details current. Other travelers see your name, photo, age and city."}</p>

      {p.missing.length > 0 && (
        <p className="mt-4 rounded-lg bg-sun-50 px-4 py-3 text-sm text-ink">
          To use Find a Partner, add your <strong>{p.missing.map((m) => missingLabel[m]).join(", ")}</strong>.
        </p>
      )}

      <div className="mt-6 space-y-6">
        <Card title="Photo"><PhotoUploader initialUrl={p.photoUrl} name={p.displayName} /></Card>
        <Card title="About you">
          <ProfileForm maxDob={maxDob} initial={{ displayName: p.displayName, bio: p.bio, city: p.city, dateOfBirth: p.dateOfBirth, gender: p.gender, interests: p.interests, languages: p.languages }} />
        </Card>
        <Card title="Find a Partner" hint="Choose whether travelers heading your way can see you.">
          <DiscoverableToggle on={p.discoverable} canEnable={p.missing.length === 0} />
          {p.missing.length > 0 && <p className="mt-2 text-sm text-ink-mute">Fill in the required fields above to turn this on.</p>}
        </Card>
        <Card title="ID verification" hint="Verified travelers get a green badge. It's optional but builds trust with travel partners.">
          <VerificationCard verified={p.verified} latest={p.verification ? { status: p.verification.status, note: p.verification.note } : null} />
        </Card>
      </div>
    </>
  );
}
