"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button, Field, Input, Select } from "@/components/ui";
import { profile as rules } from "@/config/profile";
import { saveProfile } from "@/app/(site)/(clerk)/account/profile/actions";

type Values = { displayName: string; bio: string; city: string; dateOfBirth: string; gender: string; interests: string[]; languages: string[] };

function Chips({ legend, options, value, max, onChange }: { legend: string; options: readonly string[]; value: string[]; max: number; onChange: (v: string[]) => void }) {
  return (
    <fieldset>
      <legend className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">{legend} <span className="font-medium normal-case tracking-normal text-ink-mute">(optional, up to {max})</span></legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          const full = !on && value.length >= max;
          return (
            <label key={o} className={cn("inline-flex items-center rounded-pill border px-3 py-1.5 text-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sky-500",
              on ? "border-sky-600 bg-sky-50 text-sky-700" : "border-line text-ink-soft", full ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-ink-mute")}>
              <input type="checkbox" className="sr-only" checked={on} disabled={full} onChange={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])} />
              {o}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ProfileForm({ initial, maxDob }: { initial: Values; maxDob: string }) {
  const router = useRouter();
  const uid = React.useId();
  const [v, setV] = React.useState(initial);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = React.useTransition();
  const set = <K extends keyof Values>(k: K, val: Values[K]) => { setV((p) => ({ ...p, [k]: val })); setMsg(null); };
  const id = (s: string) => `${uid}-${s}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveProfile(v);
      setMsg(r.ok ? { ok: true, text: "Profile saved." } : { ok: false, text: r.message });
      if (r.ok) router.refresh();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Display name" htmlFor={id("name")} hint="Shown to other travelers.">
          <Input id={id("name")} value={v.displayName} autoComplete="nickname" maxLength={rules.displayName.max} required onChange={(e) => set("displayName", e.target.value)} />
        </Field>
        <Field label="City" htmlFor={id("city")} hint="Only your city is ever shown.">
          <Input id={id("city")} value={v.city} autoComplete="address-level2" required onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="Date of birth" htmlFor={id("dob")} hint={`You must be ${rules.minAge} or older. Others see only your age.`}>
          <Input id={id("dob")} type="date" value={v.dateOfBirth} max={maxDob || undefined} required onChange={(e) => set("dateOfBirth", e.target.value)} />
        </Field>
        <Field label="Gender" htmlFor={id("gender")}>
          <Select id={id("gender")} value={v.gender} required onChange={(e) => set("gender", e.target.value)}>
            <option value="">Choose one</option>
            {rules.genders.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Bio" htmlFor={id("bio")} hint={`${v.bio.length}/${rules.bioMax}. Optional.`}>
        <textarea id={id("bio")} rows={3} maxLength={rules.bioMax} value={v.bio} onChange={(e) => set("bio", e.target.value)} placeholder="What kind of trips do you enjoy?"
          className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-mute focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100" />
      </Field>
      <Chips legend="Interests" options={rules.interests} value={v.interests} max={rules.maxInterests} onChange={(val) => set("interests", val)} />
      <Chips legend="Languages" options={rules.languages} value={v.languages} max={rules.maxLanguages} onChange={(val) => set("languages", val)} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save profile"}</Button>
        {msg && <p role={msg.ok ? "status" : "alert"} className={cn("text-sm font-semibold", msg.ok ? "text-leaf-700" : "text-coral-700")}>{msg.text}</p>}
      </div>
    </form>
  );
}
