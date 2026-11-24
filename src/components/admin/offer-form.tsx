"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select } from "@/components/ui";
import { Panel } from "./ui";
import { Section, SaveMessage, Toggle } from "./form";
import { deleteOffer, saveOffer, type OfferInput } from "@/app/admin/offers/actions";

const SCOPES = [["all", "All bookings"], ["domestic", "India holidays"], ["international", "International holidays"], ["group-trips", "Group trips (flat = per seat)"], ["honeymoon", "Honeymoon packages"]] as const;
const num = (v: string) => (v ? Number(v) : null);

export function OfferForm({ initial, used }: { initial: OfferInput; used: number }) {
  const router = useRouter();
  const uid = React.useId();
  const [f, setF] = React.useState(initial);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = React.useTransition();
  const set = <K extends keyof OfferInput>(k: K, v: OfferInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const id = (s: string) => `${uid}-${s}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveOffer(f);
      if (!r.ok) return setMsg({ ok: false, text: r.message });
      setMsg({ ok: true, text: "Saved." });
      if (!f.id) router.replace(`/admin/offers/${r.id}`); else router.refresh();
    });
  };
  const remove = () => start(async () => {
    if (!f.id || !window.confirm(`Delete offer ${f.code}?`)) return;
    const r = await deleteOffer(f.id);
    if (r.ok) router.replace("/admin/offers"); else setMsg({ ok: false, text: r.message ?? "Couldn't delete." });
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-6">
        <Section title="Offer">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" htmlFor={id("code")} hint="What travelers type at checkout"><Input id={id("code")} className="font-mono uppercase" value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))} /></Field>
            <Field label="Applies to" htmlFor={id("scope")}>
              <Select id={id("scope")} value={f.appliesTo} onChange={(e) => set("appliesTo", e.target.value as OfferInput["appliesTo"])}>
                {SCOPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Title" htmlFor={id("title")} hint="e.g. ₹2,000 off your first trip"><Input id={id("title")} value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Blurb" htmlFor={id("blurb")}><Input id={id("blurb")} value={f.blurb} onChange={(e) => set("blurb", e.target.value)} /></Field>
        </Section>
        <Section title="Discount">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor={id("kind")}>
              <Select id={id("kind")} value={f.kind} onChange={(e) => set("kind", e.target.value as OfferInput["kind"])}>
                <option value="flat">Flat amount (₹)</option><option value="percent">Percent (%)</option>
              </Select>
            </Field>
            <Field label={f.kind === "percent" ? "Percent off" : "Amount off (₹)"} htmlFor={id("value")}><Input id={id("value")} type="number" min={1} value={f.value || ""} onChange={(e) => set("value", Number(e.target.value))} /></Field>
            <Field label="Minimum spend (₹)" htmlFor={id("min")} hint="Optional. Before GST."><Input id={id("min")} type="number" min={1} value={f.minSpend ?? ""} onChange={(e) => set("minSpend", num(e.target.value))} /></Field>
            {f.kind === "percent" && <Field label="Maximum discount (₹)" htmlFor={id("max")} hint="Optional cap"><Input id={id("max")} type="number" min={1} value={f.maxDiscount ?? ""} onChange={(e) => set("maxDiscount", num(e.target.value))} /></Field>}
          </div>
        </Section>
        <Section title="Validity">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Starts" htmlFor={id("from")}><Input id={id("from")} type="date" value={f.validFrom} onChange={(e) => set("validFrom", e.target.value)} /></Field>
            <Field label="Ends" htmlFor={id("till")}><Input id={id("till")} type="date" min={f.validFrom || undefined} value={f.validTill} onChange={(e) => set("validTill", e.target.value)} /></Field>
            <Field label="Usage limit" htmlFor={id("limit")} hint={`Optional. Used ${used} times.`}><Input id={id("limit")} type="number" min={1} value={f.usageLimit ?? ""} onChange={(e) => set("usageLimit", num(e.target.value))} /></Field>
          </div>
        </Section>
      </div>
      <aside>
        <div className="space-y-4 xl:sticky xl:top-6">
          <Panel className="space-y-4 p-5">
            <Toggle label="Active" hint="Accepted at checkout and shown on the site." checked={f.active} onChange={(v) => set("active", v)} />
            <Field label="Card colour" htmlFor={id("tone")}>
              <Select id={id("tone")} value={f.tone} onChange={(e) => set("tone", e.target.value as OfferInput["tone"])}>
                <option value="coral">Coral</option><option value="blue">Blue</option><option value="green">Green</option><option value="yellow">Yellow</option>
              </Select>
            </Field>
            <SaveMessage msg={msg} />
            <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving..." : f.id ? "Save changes" : "Create offer"}</Button>
          </Panel>
          {f.id && <Panel className="p-5"><Button type="button" variant="outline" size="sm" className="w-full text-coral-700" onClick={remove} disabled={pending}>Delete</Button><p className="mt-2 text-xs text-ink-mute">Only works if no booking used it.</p></Panel>}
        </div>
      </aside>
    </form>
  );
}
