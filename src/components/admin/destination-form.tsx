"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select } from "@/components/ui";
import { Panel } from "./ui";
import { Section, SaveMessage, Toggle, slugify } from "./form";
import { allowedImageHosts } from "@/config/media";
import { deleteDestination, saveDestination, type DestinationInput } from "@/app/admin/destinations/actions";

export function DestinationForm({ initial }: { initial: DestinationInput }) {
  const router = useRouter();
  const uid = React.useId();
  const [f, setF] = React.useState(initial);
  const [tags, setTags] = React.useState(initial.tags.join(", "));
  const [slugTouched, setSlugTouched] = React.useState(Boolean(initial.id));
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = React.useTransition();
  const set = <K extends keyof DestinationInput>(k: K, v: DestinationInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const id = (s: string) => `${uid}-${s}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveDestination({ ...f, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) });
      if (!r.ok) return setMsg({ ok: false, text: r.message });
      setMsg({ ok: true, text: "Saved. The site shows the change now." });
      if (!f.id) router.replace(`/admin/destinations/${r.id}`); else router.refresh();
    });
  };
  const remove = () => start(async () => {
    if (!f.id || !window.confirm(`Delete ${f.name}? This can't be undone.`)) return;
    const r = await deleteDestination(f.id);
    if (r.ok) router.replace("/admin/destinations"); else setMsg({ ok: false, text: r.message ?? "Couldn't delete." });
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-6">
        <Section title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor={id("name")}><Input id={id("name")} value={f.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></Field>
            <Field label="Slug" htmlFor={id("slug")} hint={`/destinations/${f.slug || "…"}`}><Input id={id("slug")} className="font-mono text-sm" value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></Field>
            <Field label="Area" htmlFor={id("area")} hint="State or country, e.g. Kerala or Indonesia"><Input id={id("area")} value={f.area} onChange={(e) => set("area", e.target.value)} /></Field>
            <Field label="Region" htmlFor={id("region")}>
              <Select id={id("region")} value={f.region} onChange={(e) => set("region", e.target.value as DestinationInput["region"])}>
                <option value="domestic">India</option><option value="international">International</option>
              </Select>
            </Field>
          </div>
          <Field label="Tagline" htmlFor={id("tag")}><Input id={id("tag")} value={f.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Best months" htmlFor={id("months")} hint="e.g. Nov – Feb"><Input id={id("months")} value={f.bestMonths} onChange={(e) => set("bestMonths", e.target.value)} /></Field>
            <Field label="Tags" htmlFor={id("tags")} hint="Comma separated, e.g. beach, nightlife"><Input id={id("tags")} value={tags} onChange={(e) => setTags(e.target.value)} /></Field>
          </div>
        </Section>
        <Section title="Photo" hint={`Paste an image URL from ${allowedImageHosts.join(", ")}.`}>
          <Field label="Image URL" htmlFor={id("img")}><Input id={id("img")} type="url" value={f.imageSrc} onChange={(e) => set("imageSrc", e.target.value)} /></Field>
          <Field label="Image description" htmlFor={id("alt")}><Input id={id("alt")} value={f.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} /></Field>
        </Section>
      </div>
      <aside>
        <div className="space-y-4 xl:sticky xl:top-6">
          <Panel className="space-y-4 p-5">
            <Toggle label="Featured" hint="Shown in popular destinations." checked={f.featured} onChange={(v) => set("featured", v)} />
            <Field label="Sort order" htmlFor={id("sort")} hint="Lower shows first."><Input id={id("sort")} type="number" min={0} max={999} value={f.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} /></Field>
            <SaveMessage msg={msg} />
            <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving..." : f.id ? "Save changes" : "Create destination"}</Button>
          </Panel>
          {f.id && <Panel className="p-5"><Button type="button" variant="outline" size="sm" className="w-full text-coral-700" onClick={remove} disabled={pending}>Delete</Button><p className="mt-2 text-xs text-ink-mute">Only works when nothing uses this destination.</p></Panel>}
        </div>
      </aside>
    </form>
  );
}
