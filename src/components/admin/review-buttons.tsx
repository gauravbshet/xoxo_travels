"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { reviewVerification } from "@/app/admin/verifications/actions";

export function ReviewButtons({ id }: { id: string }) {
  const router = useRouter();
  const [rejecting, setRejecting] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [pending, start] = React.useTransition();

  const send = (decision: "approved" | "rejected") => start(async () => {
    setMsg("");
    const r = await reviewVerification({ id, decision, note: decision === "rejected" ? note : undefined });
    if (r.ok) router.refresh(); else setMsg(r.message);
  });

  return (
    <div className="space-y-2">
      {rejecting ? (
        <div className="space-y-2">
          <label htmlFor={`note-${id}`} className="block text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Reason shown to the traveler</label>
          <input id={`note-${id}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. Photo is blurry; name isn't readable"
            className="h-10 w-full rounded-md border border-line bg-paper px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100" />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-coral-700" onClick={() => send("rejected")} disabled={pending}>Confirm reject</Button>
            <Button size="sm" variant="outline" onClick={() => setRejecting(false)} disabled={pending}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => send("approved")} disabled={pending}>Verify</Button>
          <Button size="sm" variant="outline" onClick={() => setRejecting(true)} disabled={pending}>Reject</Button>
        </div>
      )}
      {msg && <p role="alert" className="text-sm font-semibold text-coral-700">{msg}</p>}
    </div>
  );
}
