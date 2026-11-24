"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

/* Catches render errors inside the site shell; navbar and footer stay up. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error); // Sentry hooks in here in phase 6
  }, [error]);

  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-6xl font-extrabold text-coral-600">Oops</p>
      <h1 className="mt-2 text-3xl">This page didn’t load</h1>
      <p className="mt-3 max-w-sm text-ink-soft">Try again in a moment. If it keeps happening, message us on WhatsApp and we’ll sort it out.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-mute">Ref: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="outline">Go to home</Button>
      </div>
    </div>
  );
}
