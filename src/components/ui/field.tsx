import * as React from "react";
import { cn } from "@/lib/cn";

const control =
  "h-12 w-full rounded-md border border-line bg-paper px-3.5 text-[15px] text-ink " +
  "placeholder:text-ink-mute transition-[border-color,box-shadow] duration-fast " +
  "hover:border-ink-mute focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100";

export function Field({ label, htmlFor, hint, className, children }: {
  label: string; htmlFor: string; hint?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(control, "appearance-none pr-10", className)} {...rest}>
        {children}
      </select>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-mute">
        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
