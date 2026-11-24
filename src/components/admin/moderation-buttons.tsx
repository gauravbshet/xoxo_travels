"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { moderateReview } from "@/app/admin/reviews/actions";
import { setDiscoverableAdmin } from "@/app/admin/customers/actions";

function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [msg, setMsg] = React.useState("");
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => start(async () => {
    setMsg("");
    const r = await fn();
    if (r.ok) router.refresh(); else setMsg(r.message ?? "Couldn't update.");
  });
  return { pending, msg, run };
}

export function ReviewModeration({ id, approved, featured }: { id: string; approved: boolean; featured: boolean }) {
  const { pending, msg, run } = useRun();
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {!approved && <Button size="sm" disabled={pending} onClick={() => run(() => moderateReview({ id, approved: true, featured: false }))}>Approve</Button>}
        {approved && <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => moderateReview({ id, approved: true, featured: !featured }))}>{featured ? "Unfeature" : "Feature on homepage"}</Button>}
        {approved && <Button size="sm" variant="outline" className="text-coral-700" disabled={pending} onClick={() => run(() => moderateReview({ id, approved: false, featured: false }))}>Hide</Button>}
      </div>
      {msg && <p role="alert" className="mt-1 text-sm font-semibold text-coral-700">{msg}</p>}
    </div>
  );
}

export function VisibilityButton({ userId, discoverable }: { userId: string; discoverable: boolean }) {
  const { pending, msg, run } = useRun();
  return (
    <div>
      <Button size="sm" variant="outline" className={discoverable ? "text-coral-700" : ""} disabled={pending}
        onClick={() => run(() => setDiscoverableAdmin({ userId, on: !discoverable }))}>
        {discoverable ? "Hide from Find a Partner" : "Allow in Find a Partner"}
      </Button>
      {msg && <p role="alert" className="mt-1 text-sm font-semibold text-coral-700">{msg}</p>}
    </div>
  );
}
