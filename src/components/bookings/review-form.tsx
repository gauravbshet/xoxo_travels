"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";
import { submitReview } from "@/app/(site)/(clerk)/account/bookings/actions";

export function ReviewForm({ reference, title }: { reference: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [text, setText] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [pending, start] = React.useTransition();

  if (!open) return <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Write a review</Button>;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await submitReview({ reference, rating, text });
      if (r.ok) router.refresh(); else setMsg(r.message);
    });
  };
  return (
    <form onSubmit={submit} className="w-full space-y-3">
      <fieldset>
        <legend className="text-sm font-semibold text-ink">How was {title}?</legend>
        <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sky-500">
              <input type="radio" name={`rating-${reference}`} value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" aria-label={`${n} star${n > 1 ? "s" : ""}`} />
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn(n <= rating ? "text-sun-500" : "text-line")}><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6L5.8 21l1.4-7L2 9.3l7-.8L12 2Z" /></svg>
            </label>
          ))}
        </div>
      </fieldset>
      <label htmlFor={`rv-${reference}`} className="sr-only">Your review</label>
      <textarea id={`rv-${reference}`} rows={3} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="What stood out? Hotels, guides, food, pace…"
        className="w-full rounded-md border border-line bg-paper px-3.5 py-2.5 text-[15px] placeholder:text-ink-mute focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100" />
      {msg && <p role="alert" className="text-sm font-semibold text-coral-700">{msg}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Sending..." : "Submit review"}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
      <p className="text-xs text-ink-mute">Reviews appear on the package page after a quick check.</p>
    </form>
  );
}
