import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";

export function Section({ className, children, ...rest }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("py-6 sm:py-10", className)} {...rest}>
      <div className="container-x">{children}</div>
    </section>
  );
}

export function SectionHeader({
  id, eyebrow, title, blurb, action, className,
}: {
  /** Heading id, so the parent section's aria-labelledby can point at it. */
  id?: string;
  eyebrow?: string; title: string; blurb?: string;
  action?: { label: string; href: string }; className?: string;
}) {
  return (
    <Reveal className={cn("mb-5 flex flex-col gap-2.5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:gap-3", className)}>
      <div className="max-w-xl">
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-700">{eyebrow}</p>}
        <h2 id={id} className="text-[1.75rem] leading-tight sm:text-4xl">{title}</h2>
        {blurb && <p className="mt-2 text-[15px] text-ink-soft sm:text-base">{blurb}</p>}
      </div>
      {action && (
        <Link href={action.href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-sky-700 hover:text-ink">
          {action.label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="transition-transform duration-fast group-hover:translate-x-0.5">
            <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </Reveal>
  );
}
