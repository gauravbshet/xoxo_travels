"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Panel } from "./ui";

/* Building blocks shared by the admin editors. */

export const textarea = "w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-mute focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100";
export const cap = (s: string) => s[0].toUpperCase() + s.slice(1).replace(/[-_]/g, " ");
export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
export const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

export function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="text-lg">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </Panel>
  );
}

export function CheckGroup<T extends string>({ label, options, value, onChange, labels }: { label: string; options: readonly T[]; value: T[]; onChange: (v: T[]) => void; labels?: Partial<Record<T, string>> }) {
  return (
    <fieldset>
      <legend className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <label key={o} className={cn("inline-flex cursor-pointer items-center gap-2 rounded-pill border px-3 py-1.5 text-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sky-500",
              on ? "border-sky-600 bg-sky-50 text-sky-700" : "border-line text-ink-soft hover:border-ink-mute")}>
              <input type="checkbox" className="sr-only" checked={on} onChange={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])} />
              {labels?.[o] ?? cap(o)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 accent-sky-600" />
      <span><span className="block font-semibold text-ink">{label}</span><span className="text-sm text-ink-soft">{hint}</span></span>
    </label>
  );
}

export function SaveMessage({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return <p role={msg.ok ? "status" : "alert"} className={cn("text-sm font-semibold", msg.ok ? "text-leaf-700" : "text-coral-700")}>{msg.text}</p>;
}

export type Day = { title: string; body: string; meals: ("Breakfast" | "Lunch" | "Dinner")[]; stay: string };
const MEAL_OPTIONS = ["Breakfast", "Lunch", "Dinner"] as const;

/* Add, remove and reorder itinerary days. */
export function DaysEditor({ days, onChange, idPrefix }: { days: Day[]; onChange: (d: Day[]) => void; idPrefix: string }) {
  const setDay = (i: number, patch: Partial<Day>) => onChange(days.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= days.length) return;
    const next = [...days];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const btn = "inline-flex h-9 items-center rounded-pill border border-line bg-paper px-3 text-sm font-semibold text-ink hover:border-sky-500 disabled:opacity-40";
  return (
    <>
      <ol className="space-y-3">
        {days.map((d, i) => (
          <li key={i} className="rounded-lg border border-line/70 bg-cream/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-ink-mute">Day {i + 1}</span>
              <div className="flex gap-1">
                <button type="button" className={btn} aria-label={`Move day ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button type="button" className={btn} aria-label={`Move day ${i + 1} down`} disabled={i === days.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button type="button" className={btn} onClick={() => onChange(days.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-[0.08em] text-ink-soft" htmlFor={`${idPrefix}-t${i}`}>Title</label>
              <input id={`${idPrefix}-t${i}`} value={d.title} onChange={(e) => setDay(i, { title: e.target.value })} className={textarea} />
              <label className="block text-xs font-bold uppercase tracking-[0.08em] text-ink-soft" htmlFor={`${idPrefix}-b${i}`}>Description</label>
              <textarea id={`${idPrefix}-b${i}`} rows={3} value={d.body} onChange={(e) => setDay(i, { body: e.target.value })} className={textarea} />
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckGroup label="Meals" options={MEAL_OPTIONS} value={d.meals} onChange={(v) => setDay(i, { meals: v })} />
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.08em] text-ink-soft" htmlFor={`${idPrefix}-s${i}`}>Overnight stay</label>
                  <input id={`${idPrefix}-s${i}`} value={d.stay} onChange={(e) => setDay(i, { stay: e.target.value })} className={cn(textarea, "mt-1.5")} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className={btn} disabled={days.length >= 31} onClick={() => onChange([...days, { title: "", body: "", meals: ["Breakfast"], stay: "" }])}>Add day</button>
    </>
  );
}
