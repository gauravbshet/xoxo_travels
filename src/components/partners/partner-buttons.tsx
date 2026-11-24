"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button, Select } from "@/components/ui";
import { partners as rules } from "@/config/partners";
import { blockUser, endTrip, reportUser, respondRequest, sendRequest, setDiscoverable, withdrawRequest } from "@/app/(site)/partners/actions";

const input = "w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100";

function useAction() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [msg, setMsg] = React.useState("");
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) => start(async () => {
    setMsg("");
    const r = await fn();
    if (r.ok) { after?.(); router.refresh(); } else setMsg(r.message ?? "Something went wrong. Try again.");
  });
  return { pending, msg, run, router };
}

const Err = ({ msg }: { msg: string }) => (msg ? <p role="alert" className="mt-1.5 text-sm font-semibold text-coral-700">{msg}</p> : null);

export function DiscoverableToggle({ on, canEnable }: { on: boolean; canEnable: boolean }) {
  const { pending, msg, run } = useAction();
  return (
    <div>
      <label className={cn("flex items-start gap-3", canEnable || on ? "cursor-pointer" : "cursor-not-allowed opacity-60")}>
        <input type="checkbox" className="mt-1 size-4 accent-sky-600" checked={on} disabled={pending || (!canEnable && !on)} onChange={(e) => run(() => setDiscoverable(e.target.checked))} />
        <span><span className="block font-semibold text-ink">Show me in Find a Partner</span>
          <span className="text-sm text-ink-soft">Travelers near you see your name, photo, age and city. Turn off any time.</span></span>
      </label>
      <Err msg={msg} />
    </div>
  );
}

export function EndTripButton({ id }: { id: string }) {
  const { pending, run } = useAction();
  return <button type="button" disabled={pending} onClick={() => run(() => endTrip(id))} className="text-sm font-semibold text-ink-soft hover:text-coral-700">End trip</button>;
}

export function RequestButton({ toId, name, state, conversationId }: { toId: string; name: string; state: "none" | "sent" | "received" | "connected" | "unavailable"; conversationId: string | null }) {
  const { pending, msg, run } = useAction();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  if (state === "connected") return <Button href={conversationId ? `/chat/${conversationId}` : "/chat"} size="sm">Message</Button>;
  if (state === "sent") return <span className="text-sm font-semibold text-ink-soft">Request sent</span>;
  if (state === "received") return <Button href="/partners/requests" size="sm" variant="outline">Reply to request</Button>;
  if (state === "unavailable") return <span className="text-sm text-ink-mute">Not available</span>;
  if (!open) return <Button size="sm" onClick={() => setOpen(true)}>Send request</Button>;
  return (
    <div className="w-full space-y-2">
      <label htmlFor={`rq-${toId}`} className="sr-only">Message to {name}</label>
      <textarea id={`rq-${toId}`} rows={2} maxLength={rules.requestMessageMax} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Say hi to ${name} (optional)`} className={input} />
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => run(() => sendRequest({ toId, message: text || undefined }), () => setOpen(false))}>{pending ? "Sending..." : "Send"}</Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
      <Err msg={msg} />
    </div>
  );
}

export function RespondButtons({ id }: { id: string }) {
  const { pending, msg, run, router } = useAction();
  return (
    <div>
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => run(async () => {
          const r = await respondRequest({ id, accept: true });
          if (r.ok && r.conversationId) router.push(`/chat/${r.conversationId}`);
          return r;
        })}>Accept</Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => respondRequest({ id, accept: false }))}>Decline</Button>
      </div>
      <Err msg={msg} />
    </div>
  );
}

export function WithdrawButton({ id }: { id: string }) {
  const { pending, run } = useAction();
  return <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => withdrawRequest(id))}>Withdraw</Button>;
}

/* Report and block, tucked behind a small menu on every person. */
export function SafetyMenu({ userId, name, onBlocked }: { userId: string; name: string; onBlocked?: string }) {
  const { pending, msg, run, router } = useAction();
  const [mode, setMode] = React.useState<"closed" | "menu" | "report" | "done">("closed");
  const [reason, setReason] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [alsoBlock, setAlsoBlock] = React.useState(true);

  const block = () => {
    if (!window.confirm(`Block ${name}? You won't see each other, and any chat between you closes.`)) return;
    run(() => blockUser(userId), () => { if (onBlocked) router.push(onBlocked); });
  };

  if (mode === "closed") return <button type="button" onClick={() => setMode("menu")} className="text-xs font-semibold text-ink-mute hover:text-ink">Report or block</button>;
  if (mode === "done") return <p role="status" className="text-sm font-semibold text-leaf-700">Thanks. Our team will review this.</p>;
  if (mode === "menu") {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button type="button" onClick={() => setMode("report")} className="font-semibold text-ink hover:underline">Report</button>
        <button type="button" onClick={block} disabled={pending} className="font-semibold text-coral-700 hover:underline">Block</button>
        <button type="button" onClick={() => setMode("closed")} className="text-ink-mute hover:text-ink">Cancel</button>
        <Err msg={msg} />
      </div>
    );
  }
  return (
    <div className="w-full space-y-2 rounded-lg border border-line bg-cream/50 p-3">
      <label htmlFor={`rr-${userId}`} className="block text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Report {name}</label>
      <Select id={`rr-${userId}`} value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 text-sm">
        <option value="">Choose a reason</option>
        {rules.reportReasons.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </Select>
      <textarea rows={2} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What happened? (optional)" aria-label="Details" className={input} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} className="accent-sky-600" /> Also block {name}</label>
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => run(async () => {
          const r = await reportUser({ targetId: userId, reason, details: details || undefined, alsoBlock });
          if (r.ok) { setMode("done"); if (alsoBlock && onBlocked) router.push(onBlocked); }
          return r;
        })}>Send report</Button>
        <Button size="sm" variant="outline" onClick={() => setMode("closed")}>Cancel</Button>
      </div>
      <Err msg={msg} />
    </div>
  );
}
