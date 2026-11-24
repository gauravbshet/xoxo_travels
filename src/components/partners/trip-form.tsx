"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button, Field, Input, Select } from "@/components/ui";
import { partners as rules } from "@/config/partners";
import { declareTrip } from "@/app/(site)/partners/actions";

type Loc = { lat: number; lng: number } | null;

/* Declares a trip. The browser's location is used only to measure distance to
   other travelers; it's rounded on the server and never shown. */
export function TripForm({ destinations, minDate }: { destinations: { id: string; name: string }[]; minDate: string }) {
  const router = useRouter();
  const uid = React.useId();
  const [dest, setDest] = React.useState("");
  const [other, setOther] = React.useState("");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [note, setNote] = React.useState("");
  const [loc, setLoc] = React.useState<Loc>(null);
  const [locMsg, setLocMsg] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [pending, start_] = React.useTransition();
  const id = (s: string) => `${uid}-${s}`;

  const locate = () => {
    setLocMsg("");
    if (!("geolocation" in navigator)) return setLocMsg("Your browser can't share location. Try another browser.");
    setLocMsg("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      (p) => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocMsg(""); },
      (e) => setLocMsg(e.code === e.PERMISSION_DENIED
        ? "Location is blocked. Allow it in your browser's site settings: we need it to find travelers within 200 km of you."
        : "We couldn't get your location. Try again."),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 600_000 },
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    if (!loc) return setMsg("Share your location first.");
    start_(async () => {
      const r = await declareTrip({
        destinationId: dest && dest !== "other" ? dest : undefined,
        destinationText: dest === "other" ? other : undefined,
        startDate: start, endDate: end, note: note || undefined, lat: loc.lat, lng: loc.lng,
      });
      if (!r.ok) return setMsg(r.message);
      setDest(""); setOther(""); setStart(""); setEnd(""); setNote("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Where to" htmlFor={id("dest")}>
        <Select id={id("dest")} value={dest} onChange={(e) => setDest(e.target.value)}>
          <option value="">Pick a destination</option>
          {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          <option value="other">Somewhere else…</option>
        </Select>
      </Field>
      {dest === "other" && (
        <Field label="Destination" htmlFor={id("other")}><Input id={id("other")} value={other} maxLength={60} onChange={(e) => setOther(e.target.value)} placeholder="e.g. Hampi" /></Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="From" htmlFor={id("start")}><Input id={id("start")} type="date" min={minDate || undefined} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="To" htmlFor={id("end")}><Input id={id("end")} type="date" min={start || minDate || undefined} value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
      </div>
      <Field label="Note" htmlFor={id("note")} hint={`Optional. ${note.length}/${rules.noteMax}`}>
        <textarea id={id("note")} rows={2} maxLength={rules.noteMax} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Planning a slow week, happy to split a cab"
          className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-mute focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100" />
      </Field>
      <div className={cn("rounded-lg border p-3 text-sm", loc ? "border-leaf-600/30 bg-leaf-50 text-leaf-700" : "border-line bg-cream/60 text-ink-soft")}>
        {loc ? <p className="font-semibold">Location shared. Only your city is shown to others.</p> : (
          <>
            <p>We match you with travelers within {rules.radiusKm} km of where you are now. Your exact location is never shown.</p>
            <Button type="button" size="sm" variant="outline" className="mt-2" onClick={locate}>Share my location</Button>
          </>
        )}
        {locMsg && <p role="status" className="mt-2 font-semibold text-ink">{locMsg}</p>}
      </div>
      {msg && <p role="alert" className="text-sm font-semibold text-coral-700">{msg}</p>}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving..." : "Add trip"}</Button>
    </form>
  );
}
