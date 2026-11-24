"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Badge, Button, Field, Input, Photo } from "@/components/ui";
import { booking, extraServices, priceFor, type ExtraServices } from "@/config/booking";
import { formatINR } from "@/lib/format";
import { applyCoupon, createBooking } from "@/app/(site)/checkout/actions";
import { PayPanel } from "./pay-panel";

export type CheckoutFormItem = {
  kind: "package" | "trip";
  slug: string;
  title: string;
  image: { src: string; alt: string };
  destinationName: string;
  perPerson: number;
  travelers: number;
  date: string;
  dateLabel: string;
  durationLabel: string;
  leader: string | null;
  backHref: string;
};

type Person = { name: string; age: string };
type Coupon = { code: string; title: string; discount: number };

/* ───────── small pieces ───────── */

const Icon = {
  lock: <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />,
  calendar: <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />,
  users: <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM21 19v-1a4 4 0 0 0-3-3.9M15.5 4.1a3 3 0 0 1 0 5.8" />,
  clock: <path d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  shield: <path d="M12 3 5 6v6c0 4.4 3 7.8 7 9 4-1.2 7-4.6 7-9V6l-7-3ZM9 12l2 2 4-4" />,
  refund: <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />,
  receipt: <path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3ZM10 8h4M10 12h4" />,
  passport: <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM9 17h6" />,
  sim: <path d="M8 3h6l4 4v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM10 12h4v5h-4z" />,
  plane: <path d="M10.5 13.5 3 11l1.5-1.5 7 1L16 6a2 2 0 0 1 3 3l-4.5 4.5 1 7L14 22l-2.5-7.5L8 18v2.5L6.5 22 5 18l-4-1.5L2.5 15H5l3.5-3.5" />,
  tag: <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9ZM7.5 7.5h.01" />,
  check: <path d="m5 12 5 5 9-10" />,
};
function Svg({ d, className }: { d: React.ReactNode; className?: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("shrink-0", className)}>{d}</svg>;
}

const serviceIcon = { visa: Icon.passport, esim: Icon.sim, flights: Icon.plane } as const;

/** Details → Payment → Confirmation. */
export function CheckoutSteps({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Details", "Payment", "Confirmation"];
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Checkout progress">
      {steps.map((s, i) => {
        const n = i + 1, done = n < step, current = n === step;
        return (
          <li key={s} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
            <span className={cn("grid size-7 place-items-center rounded-pill text-xs font-bold",
              done ? "bg-sky-600 text-white" : current ? "bg-ink text-white" : "border border-line bg-paper text-ink-mute")}>
              {done ? <Svg d={Icon.check} className="size-4" /> : n}
            </span>
            <span className={cn("font-semibold", current ? "text-ink" : done ? "text-ink-soft" : "text-ink-mute", !current && "hidden sm:inline")}>{s}</span>
            {n < steps.length && <span aria-hidden="true" className={cn("h-px w-6 sm:w-10", done ? "bg-sky-600" : "bg-line")} />}
          </li>
        );
      })}
    </ol>
  );
}

function CheckoutHeader({ step, backHref }: { step: 1 | 2 | 3; backHref: string }) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-line/70 pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Link href={backHref} className="text-sm font-semibold text-ink-soft hover:text-ink">← Back to trip</Link>
        <h1 className="mt-2 flex items-center gap-2 text-3xl sm:text-4xl"><Svg d={Icon.lock} className="size-6 text-sky-600 sm:size-7" />Secure checkout</h1>
      </div>
      <CheckoutSteps step={step} />
    </header>
  );
}

function Step({ n, title, hint, optional, children, id }: { n: number; title: string; hint?: string; optional?: boolean; children: React.ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="rounded-xl border border-line/70 bg-paper shadow-card">
      <div className="flex items-start gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
        <span className="grid size-8 shrink-0 place-items-center rounded-pill bg-sky-50 text-sm font-bold text-sky-700" aria-hidden="true">{n}</span>
        <div className="min-w-0">
          <h2 id={id} className="text-lg leading-tight sm:text-xl">{title}{optional && <span className="ml-2 align-middle text-sm font-normal text-ink-mute">Optional</span>}</h2>
          {hint && <p className="mt-0.5 text-sm text-ink-soft">{hint}</p>}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

/* ───────── form ───────── */

export function CheckoutForm({ item, account }: { item: CheckoutFormItem; account: { name: string; email: string; phone: string } }) {
  const uid = React.useId();
  const formId = `${uid}-form`;
  const ref = { kind: item.kind, slug: item.slug, date: item.kind === "package" ? item.date : undefined, travelers: item.travelers };

  const [people, setPeople] = React.useState<Person[]>(() =>
    Array.from({ length: item.travelers }, (_, i) => ({ name: i === 0 ? account.name : "", age: "" })));
  const [phone, setPhone] = React.useState(account.phone);
  const [services, setServices] = React.useState<ExtraServices>({ visa: false, esim: false, flights: false });
  const [couponOpen, setCouponOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [coupon, setCoupon] = React.useState<Coupon | null>(null);
  const [couponMsg, setCouponMsg] = React.useState("");
  const [checking, startCheck] = React.useTransition();
  const [saving, startSave] = React.useTransition();
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState<{ reference: string; total: number } | null>(null);

  const price = priceFor(item.perPerson, item.travelers, coupon?.discount ?? 0);
  const setPerson = (i: number, patch: Partial<Person>) => setPeople((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const pax = `${item.travelers} ${item.travelers === 1 ? "traveler" : "travelers"}`;
  const freeCancelDays = booking.cancellation[0].minDays;

  const onApply = () => {
    if (!code.trim()) return setCouponMsg("Enter a coupon code.");
    startCheck(async () => {
      const r = await applyCoupon({ ref, code });
      if (r.ok) { setCoupon({ code: r.code, title: r.title, discount: r.discount }); setCouponMsg(""); }
      else { setCoupon(null); setCouponMsg(r.message); }
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!phone.trim()) return setError("Enter a phone number so we can reach you.");
    if (people.some((p) => p.name.trim().length < 2 || p.age === "")) return setError("Enter a name and age for every traveler.");
    if (Number(people[0].age) < booking.leadMinAge) return setError(`The lead traveler must be at least ${booking.leadMinAge}.`);
    startSave(async () => {
      const r = await createBooking({ ref, phone, travelers: people.map((p) => ({ name: p.name, age: p.age })), coupon: coupon?.code, services });
      if (r.ok) { setDone({ reference: r.reference, total: r.total }); window.scrollTo({ top: 0 }); }
      else setError(r.message);
    });
  };

  if (done) {
    return (
      <>
        <CheckoutHeader step={2} backHref={item.backHref} />
        <PayPanel reference={done.reference} total={done.total} summary={`${item.title} · ${item.dateLabel} · ${pax}`} isTrip={item.kind === "trip"} backHref={item.backHref} />
      </>
    );
  }

  const submitLabel = saving ? "Saving your booking…" : `Continue to payment`;

  return (
    <>
      <CheckoutHeader step={1} backHref={item.backHref} />
      <form id={formId} onSubmit={onSubmit} noValidate className="grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10 lg:pb-0">
        <div className="min-w-0 space-y-6">
          <Step n={1} id={`${uid}-contact`} title="Contact details" hint="Your voucher, updates and payment receipt go here.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor={`${uid}-email`} hint="Verified through your account">
                <div className="relative">
                  <Input id={`${uid}-email`} value={account.email} readOnly className="bg-cream pr-10 text-ink-soft" />
                  <Svg d={Icon.lock} className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-mute" />
                </div>
              </Field>
              <Field label="Mobile number" htmlFor={`${uid}-phone`} hint="For trip-day updates only">
                <Input id={`${uid}-phone`} type="tel" autoComplete="tel" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </Field>
            </div>
          </Step>

          <Step n={2} id={`${uid}-travelers`} title="Traveler details" hint={`Enter names exactly as on government ID. The lead traveler must be ${booking.leadMinAge} or older.`}>
            <ol className="space-y-3">
              {people.map((p, i) => (
                <li key={i} className="rounded-lg border border-line/70 bg-cream/40 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-pill bg-paper text-xs font-bold text-ink ring-1 ring-line" aria-hidden="true">{i + 1}</span>
                    <span className="text-sm font-semibold text-ink">{i === 0 ? "Lead traveler" : `Traveler ${i + 1}`}</span>
                    {i === 0 && <Badge tone="blue">Main contact</Badge>}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
                    <Field label="Full name" htmlFor={`${uid}-n${i}`}>
                      <Input id={`${uid}-n${i}`} autoComplete={i === 0 ? "name" : "off"} required value={p.name} onChange={(e) => setPerson(i, { name: e.target.value })} placeholder="As on ID" />
                    </Field>
                    <Field label="Age" htmlFor={`${uid}-a${i}`}>
                      <Input id={`${uid}-a${i}`} type="number" inputMode="numeric" min={i === 0 ? booking.leadMinAge : 0} max={110} required value={p.age} onChange={(e) => setPerson(i, { age: e.target.value })} />
                    </Field>
                  </div>
                </li>
              ))}
            </ol>
          </Step>

          <Step n={3} id={`${uid}-extras`} title="Extra help" optional hint="Tick anything you'd like us to arrange. It doesn't change your price; our team contacts you after booking.">
            <ul className="grid gap-3 sm:grid-cols-3">
              {extraServices.map((x) => (
                <li key={x.key}>
                  <label className="group relative flex h-full cursor-pointer flex-col gap-2 rounded-lg border border-line p-4 transition-colors duration-fast hover:border-sky-500 has-[:checked]:border-sky-600 has-[:checked]:bg-sky-50 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sky-500">
                    <input type="checkbox" className="sr-only" checked={services[x.key]} onChange={(e) => setServices((s) => ({ ...s, [x.key]: e.target.checked }))} />
                    <span className="flex items-center justify-between">
                      <span className="grid size-9 place-items-center rounded-md bg-cream-deep text-ink group-has-[:checked]:bg-paper group-has-[:checked]:text-sky-700"><Svg d={serviceIcon[x.key]} /></span>
                      <span aria-hidden="true" className="grid size-5 place-items-center rounded-sm border border-line bg-paper text-white group-has-[:checked]:border-sky-600 group-has-[:checked]:bg-sky-600">
                        <Svg d={Icon.check} className="size-3.5" />
                      </span>
                    </span>
                    <span className="font-semibold text-ink">{x.label}</span>
                    <span className="text-sm leading-snug text-ink-soft">{x.question}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Step>
        </div>

        {/* Order summary */}
        <aside aria-label="Order summary">
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-xl border border-line/70 bg-paper shadow-card-hover">
              <div className="relative h-40 bg-cream-deep">
                <Photo src={item.image.src} alt={item.image.alt} fill sizes="(min-width: 1024px) 384px, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-ink/80 via-ink/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/85">{item.kind === "trip" ? "Group trip" : "Holiday package"} · {item.destinationName}</p>
                  <h2 className="mt-0.5 font-display text-xl font-bold leading-snug text-white">{item.title}</h2>
                </div>
              </div>

              <div className="p-5">
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-center gap-2.5 text-ink"><Svg d={Icon.calendar} className="size-4 text-ink-mute" />{item.dateLabel}</li>
                  <li className="flex items-center gap-2.5 text-ink"><Svg d={Icon.clock} className="size-4 text-ink-mute" />{item.durationLabel}</li>
                  <li className="flex items-center gap-2.5 text-ink"><Svg d={Icon.users} className="size-4 text-ink-mute" />{pax}</li>
                  {item.leader && <li className="flex items-center gap-2.5 text-ink"><Svg d={Icon.flag} className="size-4 text-ink-mute" />Led by {item.leader}</li>}
                </ul>
                <Link href={item.backHref} className="mt-3 inline-block text-sm font-semibold text-sky-700 hover:underline">Change date or travelers</Link>

                {/* Coupon */}
                <div className="mt-4 border-t border-line/70 pt-4">
                  {coupon ? (
                    <div className="flex items-center justify-between gap-2 rounded-md border border-leaf-600/30 bg-leaf-50 px-3 py-2.5 text-sm">
                      <span className="flex min-w-0 items-center gap-2"><Svg d={Icon.tag} className="size-4 text-leaf-700" /><span className="truncate"><span className="font-bold text-leaf-700">{coupon.code}</span> <span className="text-ink-soft">· you save {formatINR(coupon.discount)}</span></span></span>
                      <button type="button" onClick={() => { setCoupon(null); setCode(""); }} className="shrink-0 font-semibold text-ink-soft hover:text-ink">Remove</button>
                    </div>
                  ) : !couponOpen ? (
                    <button type="button" onClick={() => setCouponOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-sky-700 hover:underline">
                      <Svg d={Icon.tag} className="size-4" />Have a coupon code?
                    </button>
                  ) : (
                    <>
                      <label htmlFor={`${uid}-coupon`} className="block text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Coupon code</label>
                      <div className="mt-1.5 flex gap-2">
                        <Input id={`${uid}-coupon`} value={code} autoFocus onChange={(e) => { setCode(e.target.value.toUpperCase()); setCouponMsg(""); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onApply(); } }}
                          placeholder="XOXOFIRST" autoComplete="off" aria-invalid={!!couponMsg} aria-describedby={couponMsg ? `${uid}-cmsg` : undefined} className="h-11 font-mono uppercase" />
                        <Button type="button" variant="outline" onClick={onApply} disabled={checking} className="h-11">{checking ? "Checking" : "Apply"}</Button>
                      </div>
                      {couponMsg && <p id={`${uid}-cmsg`} role="alert" className="mt-1.5 text-sm font-semibold text-coral-700">{couponMsg}</p>}
                    </>
                  )}
                </div>

                {/* Price */}
                <dl className="mt-4 space-y-2 border-t border-line/70 pt-4 text-sm">
                  <div className="flex justify-between"><dt className="text-ink-soft">{formatINR(item.perPerson)} × {pax}</dt><dd className="tabular text-ink">{formatINR(price.subtotal)}</dd></div>
                  {price.discount > 0 && <div className="flex justify-between"><dt className="text-ink-soft">Coupon discount</dt><dd className="tabular font-semibold text-leaf-700">−{formatINR(price.discount)}</dd></div>}
                  <div className="flex justify-between"><dt className="text-ink-soft">{booking.gstLabel}</dt><dd className="tabular text-ink">{formatINR(price.gst)}</dd></div>
                  <div className="mt-2 flex items-end justify-between border-t border-dashed border-line pt-3">
                    <dt className="font-semibold text-ink">Total to pay<span className="block text-xs font-normal text-ink-mute">Incl. all taxes</span></dt>
                    <dd className="font-display text-3xl font-extrabold tabular text-ink">{formatINR(price.total)}</dd>
                  </div>
                </dl>

                {error && <p role="alert" className="mt-4 rounded-md bg-coral-50 px-3 py-2 text-sm font-semibold text-coral-700">{error}</p>}
                <Button type="submit" size="lg" className="mt-4 hidden w-full gap-2 lg:inline-flex" disabled={saving}>
                  <Svg d={Icon.lock} className="size-4" />{submitLabel}
                </Button>
                <p className="mt-3 text-center text-xs leading-relaxed text-ink-mute">
                  By continuing you agree to our <Link href="/policies/terms" className="underline hover:text-ink">terms</Link> and <Link href="/policies/cancellation" className="underline hover:text-ink">cancellation policy</Link>.
                </p>
              </div>
            </div>

            <ul className="grid gap-2.5 rounded-xl border border-line/70 bg-paper p-4 text-sm shadow-card">
              <li className="flex items-start gap-2.5"><Svg d={Icon.shield} className="size-5 text-sky-600" /><span><span className="font-semibold text-ink">Secure payment</span><span className="block text-ink-soft">UPI, cards and netbanking via Razorpay</span></span></li>
              <li className="flex items-start gap-2.5"><Svg d={Icon.refund} className="size-5 text-sky-600" /><span><span className="font-semibold text-ink">Free cancellation</span><span className="block text-ink-soft">Full refund up to {freeCancelDays} days before departure</span></span></li>
              <li className="flex items-start gap-2.5"><Svg d={Icon.receipt} className="size-5 text-sky-600" /><span><span className="font-semibold text-ink">No hidden charges</span><span className="block text-ink-soft">GST shown upfront; invoice emailed after payment</span></span></li>
            </ul>
          </div>
        </aside>
      </form>

      {/* Mobile: total and the main action stay in reach */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center justify-between gap-3">
          <p className="leading-tight"><span className="block text-xs text-ink-mute">Total incl. GST</span><span className="font-display text-xl font-extrabold tabular text-ink">{formatINR(price.total)}</span></p>
          <Button type="submit" form={formId} size="md" disabled={saving} className="gap-2"><Svg d={Icon.lock} className="size-4" />{saving ? "Saving…" : "Continue"}</Button>
        </div>
      </div>
    </>
  );
}
