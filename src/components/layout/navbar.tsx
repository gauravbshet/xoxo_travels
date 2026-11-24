"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { mainNav, site } from "@/config/site";
import { Button } from "@/components/ui";
import { Logo } from "./logo";
import { AuthButtons } from "@/components/auth/auth-buttons";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const scrolled = useScrolled(8);
  const close = React.useCallback(() => setOpen(false), []);

  // Lock scroll while the drawer is open; Escape closes it
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[box-shadow,background-color] duration-base ease-out-soft",
        scrolled ? "glass shadow-card" : "bg-cream/0",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-pill focus:bg-sky-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Logo size="lg" />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-pill px-4 py-2 text-[15px] font-semibold transition-colors duration-fast",
                    isActive(item.href)
                      ? "bg-sky-50 text-sky-700"
                      : item.accent
                        ? "text-coral-700 hover:bg-coral-50"
                        : "text-ink-soft hover:bg-cream-deep hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 rounded-pill px-3 py-2 text-sm font-semibold text-ink-soft hover:text-ink">
            <PhoneIcon /> {site.phone}
          </a>
          <AuthButtons />
          <Button href="/holidays" size="sm">Plan a trip</Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="grid size-11 place-items-center rounded-md text-ink hover:bg-cream-deep lg:hidden"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-base", open ? "opacity-100" : "opacity-0")}
        />
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn(
            "absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-paper shadow-card-hover",
            "transition-transform duration-base ease-out-soft",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <Logo size="lg" />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid size-11 place-items-center rounded-md hover:bg-cream-deep">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-md px-4 py-3 text-base font-semibold",
                      isActive(item.href) ? "bg-sky-50 text-sky-700" : item.accent ? "text-coral-700" : "text-ink hover:bg-cream-deep",
                    )}
                  >
                    {item.label}
                    <ChevronIcon />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-3 border-t border-line p-4">
            <Button href="/holidays" className="w-full">Plan a trip</Button>
            <AuthButtons compact />
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-ink-soft">
              <PhoneIcon /> {site.phone}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

/** True once the page is scrolled past `threshold` px. Subscribes outside React state. */
function useScrolled(threshold: number) {
  const subscribe = React.useCallback((cb: () => void) => {
    window.addEventListener("scroll", cb, { passive: true });
    return () => window.removeEventListener("scroll", cb);
  }, []);
  return React.useSyncExternalStore(
    subscribe,
    () => window.scrollY > threshold,
    () => false,
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-ink-mute">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
