import Link from "next/link";
import { cn } from "@/lib/cn";

export type Chip = { label: string; value?: string };

const hrefFor = (base: string, params: URLSearchParams, param: string, value?: string) => {
  const next = new URLSearchParams(params);
  if (value) next.set(param, value); else next.delete(param);
  return `${base}${next.size ? `?${next}` : ""}`;
};

/* Card that holds the filter rows. Rows are divided by hairlines. */
export function FilterPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-6 divide-y divide-line/70 rounded-xl border border-line/70 bg-paper px-4 shadow-card sm:px-5", className)}>
      {children}
    </div>
  );
}

/* One filter row, link-based: no JS, every state is a URL. Label sits in a
   fixed column on wider screens; on phones the chips scroll sideways
   instead of wrapping into a ragged block. */
export function FilterChips({ label, param, chips, current, base, params }: {
  label: string; param: string; chips: Chip[]; current?: string; base: string; params: URLSearchParams;
}) {
  return (
    <div className="grid gap-2 py-3 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-center sm:gap-4" role="group" aria-label={label}>
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-mute">{label}</span>
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        <ul className="flex gap-1.5 sm:flex-wrap">
          {chips.map((c) => {
            const active = (current ?? undefined) === c.value;
            return (
              <li key={c.label} className="shrink-0">
                <Link href={hrefFor(base, params, param, c.value)} scroll={false} aria-current={active ? "true" : undefined}
                  className={cn("inline-flex h-8 items-center whitespace-nowrap rounded-pill px-3.5 text-[13px] font-semibold transition-colors duration-fast",
                    active ? "bg-sky-600 text-white shadow-sm" : "bg-cream-deep/70 text-ink-soft hover:bg-sky-50 hover:text-sky-700")}>
                  {c.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* Result count, a "Clear filters" link when anything is set, and optional sort tabs. */
export function ResultsBar({ count, noun, query, clearHref, activeCount, sort }: {
  count: number; noun: [string, string]; query?: string; clearHref: string; activeCount: number;
  sort?: { param: string; options: Chip[]; current?: string; base: string; params: URLSearchParams };
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-soft">
        <strong className="font-semibold text-ink tabular">{count}</strong> {count === 1 ? noun[0] : noun[1]}
        {query && <> for <strong className="text-ink">“{query}”</strong></>}
        {activeCount > 0 && (
          <>
            <span aria-hidden="true" className="mx-2 text-line">|</span>
            <Link href={clearHref} scroll={false} className="font-semibold text-sky-600 hover:underline">Clear filters ({activeCount})</Link>
          </>
        )}
      </p>
      {sort && (
        <div className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden" role="group" aria-label="Sort">
          <span className="mr-1 shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-mute">Sort</span>
          {sort.options.map((o) => {
            const active = (sort.current ?? undefined) === o.value;
            return (
              <Link key={o.label} href={hrefFor(sort.base, sort.params, sort.param, o.value)} scroll={false} aria-current={active ? "true" : undefined}
                className={cn("shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors duration-fast",
                  active ? "bg-ink font-semibold text-white" : "text-ink-soft hover:bg-cream-deep hover:text-ink")}>
                {o.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function EmptyState({ title, blurb, action }: { title: string; blurb: string; action: { label: string; href: string } }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-paper p-10 text-center">
      <h2 className="text-2xl">{title}</h2>
      <p className="mt-2 text-ink-soft">{blurb}</p>
      <Link href={action.href} className="mt-6 inline-flex h-11 items-center rounded-pill border border-line bg-paper px-5 font-semibold text-ink hover:border-sky-500 hover:text-sky-600">{action.label}</Link>
    </div>
  );
}

export function PageHeader({ eyebrow, title, blurb }: { eyebrow: string; title: string; blurb: string }) {
  return (
    <header className="mb-8 max-w-2xl">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-700">{eyebrow}</p>
      <h1 className="text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-3 text-ink-soft">{blurb}</p>
    </header>
  );
}
