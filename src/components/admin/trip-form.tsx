"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select } from "@/components/ui";
import { Panel } from "./ui";
import { DaysEditor, Section, SaveMessage, Toggle, lines, slugify, textarea, type Day } from "./form";
import { allowedImageHosts } from "@/config/media";
import { deleteTrip, saveTrip, type TripInput } from "@/app/admin/group-trips/actions";

type Form = Omit<TripInput, "days"> & { days: Day[] };
const STYLES = [["trek", "Trek"], ["backpacking", "Backpacking"], ["roadtrip", "Road trip"], ["women_only", "Women only"]] as const;

export function TripForm({ initial, destinations, sold }: { initial: Form; destinations: { id: string; name: string }[]; sold: number }) {
  const router = useRouter();
  const uid = React.useId();
  const [f, setF] = React.useState(initial);
  const [txt, setTxt] = React.useState({ inc: initial.inclusions.join("\n"), exc: initial.exclusions.join("\n"), gtk: initial.goodToKnow.join("\n") });
  const [slugTouched, setSlugTouched] = React.useState(Boolean(initial.id));
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = React.useTransition();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const id = (s: string) => `${uid}-${s}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveTrip({ ...f, inclusions: lines(txt.inc), exclusions: lines(txt.exc), goodToKnow: lines(txt.gtk) });
      if (!r.ok) return setMsg({ ok: false, text: r.message });
      setMsg({ ok: true, text: "Saved. The site shows the change now." });
      if (!f.id) router.replace(`/admin/group-trips/${r.id}`); else router.refresh();
    });
  };
  const remove = () => start(async () => {
    if (!f.id || !window.confirm(`Delete "${f.title}"? Its waitlist is deleted too. This can't be undone.`)) return;
    const r = await deleteTrip(f.id);
    if (r.ok) router.replace("/admin/group-trips"); else setMsg({ ok: false, text: r.message ?? "Couldn't delete." });
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-6">
        <Section title="Basics">
          <Field label="Title" htmlFor={id("title")}><Input id={id("title")} value={f.title} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></Field>
          <Field label="Slug" htmlFor={id("slug")} hint={`/group-trips/${f.slug || "…"}`}><Input id={id("slug")} className="font-mono text-sm" value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Destination" htmlFor={id("dest")}>
              <Select id={id("dest")} value={f.destinationId} onChange={(e) => set("destinationId", e.target.value)}>
                <option value="">Pick a destination</option>
                {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Style" htmlFor={id("style")}>
              <Select id={id("style")} value={f.style} onChange={(e) => set("style", e.target.value as Form["style"])}>
                {STYLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Departs" htmlFor={id("start")}><Input id={id("start")} type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
            <Field label="Returns" htmlFor={id("end")}><Input id={id("end")} type="date" min={f.startDate || undefined} value={f.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
            <Field label="Price per person (₹)" htmlFor={id("price")} hint="Before GST"><Input id={id("price")} type="number" min={1} value={f.price || ""} onChange={(e) => set("price", Number(e.target.value))} /></Field>
            <Field label="Total seats" htmlFor={id("seats")} hint={sold ? `${sold} already sold` : undefined}><Input id={id("seats")} type="number" min={Math.max(1, sold)} value={f.seatsTotal} onChange={(e) => set("seatsTotal", Number(e.target.value))} /></Field>
          </div>
        </Section>

        <Section title="Leader and meeting point">
          <Field label="Leader name" htmlFor={id("leader")}><Input id={id("leader")} value={f.leader} onChange={(e) => set("leader", e.target.value)} /></Field>
          <Field label="Leader bio" htmlFor={id("bio")} hint="Optional. Leave empty for the default."><textarea id={id("bio")} rows={2} maxLength={400} value={f.leaderBio} onChange={(e) => set("leaderBio", e.target.value)} className={textarea} /></Field>
          <Field label="Meeting point" htmlFor={id("meet")} hint="Optional. Leave empty for the default."><Input id={id("meet")} value={f.meetingPoint} maxLength={200} onChange={(e) => set("meetingPoint", e.target.value)} /></Field>
        </Section>

        <Section title="Photo" hint={`Paste an image URL from ${allowedImageHosts.join(", ")}.`}>
          <Field label="Image URL" htmlFor={id("img")}><Input id={id("img")} type="url" value={f.imageSrc} onChange={(e) => set("imageSrc", e.target.value)} /></Field>
          <Field label="Image description" htmlFor={id("alt")}><Input id={id("alt")} value={f.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} /></Field>
        </Section>

        <Section title="Day-by-day itinerary" hint="Leave empty to use a generated outline.">
          <DaysEditor days={f.days} onChange={(d) => set("days", d)} idPrefix={id("day")} />
        </Section>

        <Section title="Lists" hint="One item per line. Leave a list empty to use the defaults.">
          <Field label="Included" htmlFor={id("inc")}><textarea id={id("inc")} rows={4} value={txt.inc} onChange={(e) => setTxt({ ...txt, inc: e.target.value })} className={textarea} /></Field>
          <Field label="Not included" htmlFor={id("exc")}><textarea id={id("exc")} rows={3} value={txt.exc} onChange={(e) => setTxt({ ...txt, exc: e.target.value })} className={textarea} /></Field>
          <Field label="Good to know" htmlFor={id("gtk")}><textarea id={id("gtk")} rows={3} value={txt.gtk} onChange={(e) => setTxt({ ...txt, gtk: e.target.value })} className={textarea} /></Field>
        </Section>
      </div>
      <aside>
        <div className="space-y-4 xl:sticky xl:top-6">
          <Panel className="space-y-4 p-5">
            <Toggle label="Active" hint="Shown on the site and bookable." checked={f.active} onChange={(v) => set("active", v)} />
            <Toggle label="Featured" hint="Eligible for the homepage." checked={f.featured} onChange={(v) => set("featured", v)} />
            <SaveMessage msg={msg} />
            <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving..." : f.id ? "Save changes" : "Create trip"}</Button>
          </Panel>
          {f.id && (
            <Panel className="space-y-2 p-5">
              {/* Plain link: it's a file download from a route handler, not a page. */}
              <a href={`/admin/group-trips/${f.id}/waitlist`} download className="inline-flex h-9 w-full items-center justify-center rounded-pill border border-line bg-paper px-4 text-sm font-semibold text-ink hover:border-sky-500">Download waitlist (CSV)</a>
              <Button type="button" variant="outline" size="sm" className="w-full text-coral-700" onClick={remove} disabled={pending}>Delete permanently</Button>
              <p className="text-xs text-ink-mute">Delete only works when the trip has no bookings.</p>
            </Panel>
          )}
        </div>
      </aside>
    </form>
  );
}
