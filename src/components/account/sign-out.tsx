"use client";

import { SignOutButton } from "@clerk/nextjs";

export function SignOut() {
  return (
    <SignOutButton redirectUrl="/">
      <button type="button" className="inline-flex h-10 items-center gap-2 rounded-pill border border-line bg-paper px-4 text-sm font-semibold text-ink-soft transition-colors duration-fast hover:border-coral-600 hover:text-coral-700">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" /></svg>
        Sign out
      </button>
    </SignOutButton>
  );
}
