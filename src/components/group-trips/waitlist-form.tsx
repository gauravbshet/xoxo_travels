"use client";

import * as React from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { booking } from "@/config/booking";
import { joinWaitlist, type WaitlistState } from "@/app/(site)/group-trips/[slug]/actions";

const initial: WaitlistState = { status: "idle", message: "" };

export function WaitlistForm({ slug }: { slug: string }) {
  const uid = React.useId();
  const [state, action, pending] = React.useActionState(joinWaitlist, initial);

  if (state.status === "ok") {
    return <p role="status" className="rounded-lg bg-leaf-50 p-4 text-sm font-semibold text-leaf-700">{state.message}</p>;
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="slug" value={slug} />
      <Field label="Name" htmlFor={`${uid}-name`}>
        <Input id={`${uid}-name`} name="name" autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor={`${uid}-email`}>
        <Input id={`${uid}-email`} name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Seats you need" htmlFor={`${uid}-pax`}>
        <Select id={`${uid}-pax`} name="travelers" defaultValue="1">
          {Array.from({ length: booking.maxTravelers }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
        </Select>
      </Field>
      {state.status === "error" && <p role="alert" className="text-sm font-semibold text-coral-700">{state.message}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Joining..." : "Join the waitlist"}</Button>
    </form>
  );
}
