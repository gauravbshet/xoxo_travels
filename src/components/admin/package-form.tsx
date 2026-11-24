"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button, Field, Input, Select } from "@/components/ui";
import { Panel } from "./ui";
import { CheckGroup, Section, Toggle, lines, slugify, textarea } from "./form";
import { INCLUSIONS, MEALS, THEMES } from "@/config/catalog";
import { allowedImageHosts } from "@/config/media";
import { deletePackage, savePackage, setPackageActive, type PackageInput } from "@/app/admin/packages/actions";

type Day = { title: string; body: string; meals: (typeof MEALS)[number][]; stay: string };
type Form = Omit<PackageInput, "days"> & { days: Day[] };

export function PackageForm({ initial, destinations }: { initial: Form; destinations: { id: string; name: string }[] }) {
  const router = useRouter();
  const uid = React.useId();
  const [f, setF] = React.useState<Form>(initial);
  const [slugTouched, setSlugTouched] = React.useState(Boolean(initial.id));
  const [exclText, setExclText] = React.useState(initial.exclusions.join("\n"));
  const [gtkText, setGtkText] = React.useState(initial.goodToKnow.join("\n"));
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = React.useTransition();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const id = (s: string) => `${uid}-${s}`;

  const setDay = (i: number, patch: Partial<Day>) => set("days", f.days.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const moveDay = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= f.days.length) return;
    const next = [...f.days];
    [next[i], next[j]] = [next[j], next[i]];
    set("days", next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const payload = { ...f, highlights: f.highlights.map((h) => h.trim()).filter(Boolean), exclusions: lines(exclText), goodToKnow: lines(gtkText) };
      const r = await savePackage(payload);
      if (!r.ok) { setMsg({ ok: false, text: r.message }); return; }
      setMsg({ ok: true, text: "Saved. The site shows the change now." });
      if (!f.id) router.replace(`/admin/packages/${r.id}`); else router.refresh();
    });
  };

  const toggleActive = () => start(async () => {
    if (!f.id) return;
    const r = await setPackageActive(f.id, !f.active);
    if (r.ok) { set("active", !f.active); setMsg({ ok: true, text: !f.active ? "Package is live on the site." : "Package hidden from the site." }); router.refresh(); }
    else setMsg({ ok: false, text: r.message ?? "Couldn't update." });
  });

  const remove = () => start(async () => {
    if (!f.id || !window.confirm(`Delete "${f.title}" permanently? This can't be undone.`)) return;
    const r = await deletePackage(f.id);
    if (r.ok) router.replace("/admin/packages");
    else setMsg({ ok: false, text: r.message ?? "Couldn't delete." });
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-6">
        <Section title="Basics">
          <Field label="Title" htmlFor={id("title")}>
            <Input id={id("title")} value={f.title} required onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
          </Field>
          <Field label="Slug" htmlFor={id("slug")} hint={`Page address: /holidays/${f.slug || "…"}`}>
            <Input id={id("slug")} value={f.slug} required className="font-mono text-sm" onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Destination" htmlFor={id("dest")}>
              <Select id={id("dest")} value={f.destinationId} onChange={(e) => set("destinationId", e.target.value)}>
                <option value="">Pick a destination</option>
                {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Nights" htmlFor={id("nights")} hint={`${f.nights + 1} days`}>
              <Input id={id("nights")} type="number" min={1} max={30} value={f.nights} onChange={(e) => set("nights", Number(e.target.value))} />
            </Field>
            <Field label="Price per person (₹)" htmlFor={id("price")} hint="Before GST">
              <Input id={id("price")} type="number" min={1} value={f.price || ""} onChange={(e) => set("price", Number(e.target.value))} />
            </Field>
            <Field label="Was price (₹)" htmlFor={id("list")} hint="Optional. Shows as struck through.">
              <Input id={id("list")} type="number" min={1} value={f.listPrice ?? ""} onChange={(e) => set("listPrice", e.target.value ? Number(e.target.value) : null)} />
            </Field>
          </div>
        </Section>

        <Section title="Photo" hint={`Paste an image URL from ${allowedImageHosts.join(", ")}. Uploads arrive in a later phase.`}>
          <Field label="Image URL" htmlFor={id("img")}>
            <Input id={id("img")} type="url" value={f.imageSrc} placeholder="https://images.unsplash.com/photo-…" onChange={(e) => set("imageSrc", e.target.value)} />
          </Field>
          <Field label="Image description" htmlFor={id("alt")} hint="Describes the photo for screen readers.">
            <Input id={id("alt")} value={f.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} />
          </Field>
        </Section>

        <Section title="Highlights and tags">
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Highlights (up to 6)</legend>
            <ul className="mt-2 space-y-2">
              {f.highlights.map((h, i) => (
                <li key={i} className="flex gap-2">
                  <label htmlFor={id(`h${i}`)} className="sr-only">Highlight {i + 1}</label>
                  <Input id={id(`h${i}`)} value={h} className="h-10" onChange={(e) => set("highlights", f.highlights.map((x, j) => (j === i ? e.target.value : x)))} />
                  <Button type="button" variant="outline" size="sm" className="h-10" aria-label={`Remove highlight ${i + 1}`} disabled={f.highlights.length === 1}
                    onClick={() => set("highlights", f.highlights.filter((_, j) => j !== i))}>Remove</Button>
                </li>
              ))}
            </ul>
            {f.highlights.length < 6 && <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => set("highlights", [...f.highlights, ""])}>Add highlight</Button>}
          </fieldset>
          <CheckGroup label="Included" options={INCLUSIONS} value={f.inclusions} onChange={(v) => set("inclusions", v)} />
          <CheckGroup label="Themes" options={THEMES} value={f.themes} onChange={(v) => set("themes", v)} />
        </Section>

        <Section title="Day-by-day itinerary" hint="Leave empty to use a generated outline. Days are numbered in this order.">
          <ol className="space-y-3">
            {f.days.map((d, i) => (
              <li key={i} className="rounded-lg border border-line/70 bg-cream/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.1em] text-ink-mute">Day {i + 1}</span>
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" size="sm" aria-label={`Move day ${i + 1} up`} disabled={i === 0} onClick={() => moveDay(i, -1)}>↑</Button>
                    <Button type="button" variant="outline" size="sm" aria-label={`Move day ${i + 1} down`} disabled={i === f.days.length - 1} onClick={() => moveDay(i, 1)}>↓</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => set("days", f.days.filter((_, j) => j !== i))}>Remove</Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <Field label="Title" htmlFor={id(`dt${i}`)}><Input id={id(`dt${i}`)} value={d.title} className="h-10" onChange={(e) => setDay(i, { title: e.target.value })} /></Field>
                  <Field label="Description" htmlFor={id(`db${i}`)}><textarea id={id(`db${i}`)} rows={3} value={d.body} className={textarea} onChange={(e) => setDay(i, { body: e.target.value })} /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <CheckGroup label="Meals" options={MEALS} value={d.meals} onChange={(v) => setDay(i, { meals: v })} />
                    <Field label="Overnight stay" htmlFor={id(`ds${i}`)}><Input id={id(`ds${i}`)} value={d.stay} placeholder="e.g. Ubud" className="h-10" onChange={(e) => setDay(i, { stay: e.target.value })} /></Field>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <Button type="button" variant="outline" size="sm" onClick={() => set("days", [...f.days, { title: "", body: "", meals: ["Breakfast"], stay: "" }])} disabled={f.days.length >= 31}>Add day</Button>
        </Section>

        <Section title="Notes" hint="One item per line.">
          <Field label="Not included" htmlFor={id("excl")}><textarea id={id("excl")} rows={4} value={exclText} className={textarea} onChange={(e) => setExclText(e.target.value)} /></Field>
          <Field label="Good to know" htmlFor={id("gtk")}><textarea id={id("gtk")} rows={4} value={gtkText} className={textarea} onChange={(e) => setGtkText(e.target.value)} /></Field>
        </Section>
      </div>

      <aside>
        <div className="space-y-4 xl:sticky xl:top-6">
          <Panel className="space-y-4 p-5">
            <Toggle label="Active" hint="Shown on the site and bookable." checked={f.active} onChange={(v) => set("active", v)} />
            <Toggle label="Featured" hint="Eligible for the homepage." checked={f.featured} onChange={(v) => set("featured", v)} />
            <Toggle label="Bestseller" hint="Adds a Bestseller badge." checked={f.bestseller} onChange={(v) => set("bestseller", v)} />
            {msg && <p role={msg.ok ? "status" : "alert"} className={cn("text-sm font-semibold", msg.ok ? "text-leaf-700" : "text-coral-700")}>{msg.text}</p>}
            <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving..." : f.id ? "Save changes" : "Create package"}</Button>
          </Panel>
          {f.id && (
            <Panel className="space-y-2 p-5">
              <p className="text-sm font-semibold text-ink">Visibility</p>
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={toggleActive} disabled={pending}>{f.active ? "Deactivate now" : "Activate now"}</Button>
              <Button type="button" variant="outline" size="sm" className="w-full text-coral-700" onClick={remove} disabled={pending}>Delete permanently</Button>
              <p className="text-xs text-ink-mute">Delete only works when the package has no bookings or reviews.</p>
            </Panel>
          )}
        </div>
      </aside>
    </form>
  );
}
