"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";

type Res = { ok: boolean; message?: string };

/* Edit / view / hide / delete buttons for one row of an admin catalog table.
   Delete is offered only when nothing references the item; otherwise the reason
   is shown and hiding is the way to take it off the site. */
export function RowActions({ id, name, editHref, viewHref, active, onToggle, onDelete, blockedReason }: {
  id: string;
  name: string;
  editHref: string;
  viewHref?: string;
  active?: boolean;
  onToggle?: (id: string, active: boolean) => Promise<Res>;
  onDelete: (id: string) => Promise<Res>;
  /** Why delete isn't possible (e.g. "Has 3 bookings"). Empty when deletable. */
  blockedReason?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const btn = "inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-semibold transition-colors duration-fast disabled:cursor-not-allowed disabled:opacity-50";

  const toggle = () => start(async () => {
    if (!onToggle) return;
    setMsg(null);
    const r = await onToggle(id, !active);
    if (r.ok) router.refresh(); else setMsg(r.message ?? "Couldn't update.");
  });
  const remove = () => start(async () => {
    if (!window.confirm(`Delete "${name}" permanently? This can't be undone.`)) return;
    setMsg(null);
    const r = await onDelete(id);
    if (r.ok) router.refresh(); else setMsg(r.message ?? "Couldn't delete.");
  });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1.5">
        <Link href={editHref} className={cn(btn, "border-line bg-paper text-ink hover:border-sky-500 hover:text-sky-700")}>Edit</Link>
        {viewHref && <Link href={viewHref} target="_blank" className={cn(btn, "border-line bg-paper text-ink hover:border-sky-500 hover:text-sky-700")}>View</Link>}
        {onToggle && (
          <button type="button" onClick={toggle} disabled={pending} className={cn(btn, "border-line bg-paper text-ink hover:border-sky-500")}>
            {active ? "Hide" : "Show"}
          </button>
        )}
        <button type="button" onClick={remove} disabled={pending || !!blockedReason} title={blockedReason || `Delete ${name}`}
          className={cn(btn, "border-coral-500/40 bg-paper text-coral-700 hover:border-coral-600 hover:bg-coral-50")}>
          Delete
        </button>
      </div>
      {blockedReason && <p className="text-[11px] text-ink-mute">{blockedReason}</p>}
      {msg && <p role="alert" className="max-w-[16rem] text-right text-xs text-coral-700">{msg}</p>}
    </div>
  );
}
