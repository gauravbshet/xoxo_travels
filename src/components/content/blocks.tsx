import * as React from "react";
import { cn } from "@/lib/cn";

/* Shared pieces for content pages (offers, visa, support, about, policies). */

export function ContentHero({ eyebrow, title, blurb, children }: { eyebrow: string; title: string; blurb: string; children?: React.ReactNode }) {
  return (
    <header className="relative overflow-hidden bg-[linear-gradient(115deg,var(--color-ink)_0%,#141d33_60%,#1b2640_100%)] text-white">
      <span aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-sun-400/15 blur-3xl" />
      <div className="container-x relative py-12 sm:py-16">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-sun-400">{eyebrow}</p>
        <h1 className="max-w-3xl text-[2.25rem] leading-tight text-white sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-white/80 sm:text-lg">{blurb}</p>
        {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
      </div>
    </header>
  );
}

export function Block({ title, id, children, className }: { title?: string; id?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className={cn("scroll-mt-24 py-8 sm:py-10", className)}>
      {title && <h2 id={id ? `${id}-h` : undefined} className="mb-4 text-2xl sm:text-3xl">{title}</h2>}
      {children}
    </section>
  );
}

export function Steps({ items }: { items: [string, string][] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([t, d], i) => (
        <li key={t} className="rounded-xl border border-line/70 bg-paper p-5 shadow-card">
          <span className="tabular grid size-9 place-items-center rounded-pill bg-sky-600 text-sm font-bold text-white">{i + 1}</span>
          <p className="mt-3 font-display text-lg font-bold text-ink">{t}</p>
          <p className="mt-1 text-sm text-ink-soft">{d}</p>
        </li>
      ))}
    </ol>
  );
}

/* Native <details>: works without JS, keyboard and screen-reader friendly. */
export function Faq({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line/70 bg-paper">
      {items.map(([q, a]) => (
        <details key={q} className="group [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink hover:bg-cream/60">
            {q}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-ink-mute transition-transform duration-fast group-open:rotate-180"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </summary>
          <div className="px-5 pb-5 text-[15px] leading-relaxed text-ink-soft">{a}</div>
        </details>
      ))}
    </div>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-ink-soft [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink [&_ul]:space-y-1.5">
      {children}
    </div>
  );
}

export function DraftNotice() {
  return (
    <p role="note" className="mb-6 max-w-3xl rounded-lg border border-sun-500/40 bg-sun-50 px-4 py-3 text-sm text-ink">
      <strong>Draft for legal review.</strong> This text is a starting point written for XOXO Travels and must be reviewed by a qualified lawyer before launch.
    </p>
  );
}
