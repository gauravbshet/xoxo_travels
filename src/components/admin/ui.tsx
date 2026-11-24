import Link from "next/link";
import { cn } from "@/lib/cn";

export function AdminHeader({ title, blurb, action }: { title: string; blurb?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        {blurb && <p className="mt-1 text-sm text-ink-soft">{blurb}</p>}
      </div>
      {action}
    </header>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("overflow-hidden rounded-xl border border-line/70 bg-paper shadow-card", className)}>{children}</div>;
}

/* Horizontal-scrolling table wrapper so wide tables never break the page on phones. */
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <Panel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">{children}</table>
      </div>
    </Panel>
  );
}

export const th = "bg-cream-deep px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft";
export const td = "border-t border-line/70 px-4 py-3 align-middle";

export function Pager({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  const btn = "inline-flex h-9 items-center rounded-md border border-line bg-paper px-3 text-sm font-semibold";
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm text-ink-soft">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-2">
        {page > 1 ? <Link className={cn(btn, "hover:border-sky-500")} href={hrefFor(page - 1)}>Previous</Link> : <span className={cn(btn, "opacity-40")}>Previous</span>}
        {page < pages ? <Link className={cn(btn, "hover:border-sky-500")} href={hrefFor(page + 1)}>Next</Link> : <span className={cn(btn, "opacity-40")}>Next</span>}
      </div>
    </nav>
  );
}
