"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { formatINR } from "@/lib/format";
import { cancelBooking } from "@/app/admin/bookings/actions";

type Mode = "policy" | "full" | "none";

export function CancelPanel({ reference, paid, policyShare, policyLabel, owed }: { reference: string; paid: number | null; policyShare: number; policyLabel: string; owed: boolean }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("policy");
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = React.useTransition();
  const amount = paid === null ? 0 : owed ? paid : mode === "full" ? paid : mode === "none" ? 0 : Math.round(paid * policyShare);

  const go = () => start(async () => {
    const what = paid === null ? `Cancel unpaid booking ${reference}?` : `${owed ? "Refund" : "Cancel"} ${reference} and refund ${formatINR(amount)}? This can't be undone.`;
    if (!window.confirm(what)) return;
    const r = await cancelBooking({ reference, mode: owed ? "full" : mode });
    if (r.ok) { setMsg({ ok: true, text: r.refunded ? `Done. Refunded ${formatINR(r.refunded)}.` : "Booking cancelled." }); router.refresh(); }
    else setMsg({ ok: false, text: r.message });
  });

  return (
    <div className="space-y-3 text-sm">
      {paid !== null && !owed && (
        <fieldset className="space-y-2">
          <legend className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Refund</legend>
          {([["policy", `By policy: ${policyLabel} (${formatINR(Math.round(paid * policyShare))})`], ["full", `Full refund (${formatINR(paid)})`], ["none", "No refund"]] as const).map(([v, l]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2"><input type="radio" name="refund-mode" checked={mode === v} onChange={() => setMode(v)} className="accent-sky-600" /> {l}</label>
          ))}
        </fieldset>
      )}
      {owed && <p className="font-semibold text-coral-700">A full refund of {formatINR(paid ?? 0)} is owed on this booking.</p>}
      <Button variant="outline" size="sm" className="text-coral-700" onClick={go} disabled={pending}>
        {pending ? "Working..." : paid === null ? "Cancel booking" : owed ? `Refund ${formatINR(amount)}` : amount ? `Cancel and refund ${formatINR(amount)}` : "Cancel without refund"}
      </Button>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "font-semibold text-leaf-700" : "font-semibold text-coral-700"}>{msg.text}</p>}
    </div>
  );
}
