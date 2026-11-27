"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Button, Photo } from "@/components/ui";
import type { PromoSlide } from "@/lib/data/promos";

const INTERVAL = 6500; // ms per slide

/* Overlay per tone: dark on the text side, the brand tone through the middle, photo showing on the right. */
const overlay: Record<PromoSlide["tone"], string> = {
  coral: "linear-gradient(100deg, rgb(11 18 32 / 0.92) 0%, rgb(154 52 18 / 0.78) 48%, rgb(154 52 18 / 0.15) 100%)",
  blue: "linear-gradient(100deg, rgb(11 18 32 / 0.92) 0%, rgb(7 82 63 / 0.8) 48%, rgb(7 82 63 / 0.15) 100%)",
  green: "linear-gradient(100deg, rgb(11 18 32 / 0.92) 0%, rgb(31 79 168 / 0.8) 48%, rgb(31 79 168 / 0.15) 100%)",
  yellow: "linear-gradient(100deg, rgb(11 18 32 / 0.92) 0%, rgb(122 90 0 / 0.8) 48%, rgb(122 90 0 / 0.15) 100%)",
};

/* Today's date on the client only (the server prerenders without a clock). */
const subscribe = () => () => {};
function useToday() {
  return React.useSyncExternalStore(subscribe, () => new Date().toISOString().slice(0, 10), () => null);
}
function daysLeft(today: string, till: string) {
  return Math.round((new Date(till).getTime() - new Date(today).getTime()) / 86_400_000);
}
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function Countdown({ till }: { till: string }) {
  const today = useToday();
  if (!today) return <span>Valid till {shortDate(till)}</span>;
  const d = daysLeft(today, till);
  if (d <= 0) return <span className="font-bold text-sun-400">Ends today</span>;
  if (d <= 7) return <span className="font-bold text-sun-400">Ends in {d} {d === 1 ? "day" : "days"}</span>;
  return <span>Valid till {shortDate(till)}</span>;
}

function CodeChip({ code, tabIndex }: { code: string; tabIndex?: number }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked: the code stays visible */ }
  };
  return (
    <button type="button" onClick={copy} aria-live="polite" tabIndex={tabIndex}
      className="inline-flex h-11 items-center gap-2 rounded-pill border border-dashed border-white/60 bg-white/10 px-4 font-mono text-sm font-bold tracking-wider text-white backdrop-blur-sm transition-colors duration-fast hover:bg-white/20">
      {code}
      <span className="font-sans text-xs font-semibold text-white/85">{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}

function Slide({ s, i, n, active }: { s: PromoSlide; i: number; n: number; active: boolean }) {
  return (
    <li aria-roledescription="slide" aria-label={`${i + 1} of ${n}: ${s.title}`} aria-hidden={!active}
      className="relative w-full shrink-0 snap-center overflow-hidden rounded-xl bg-ink">
      <Photo src={s.image.src} alt={s.image.alt} fill sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
      <div className="absolute inset-0" style={{ backgroundImage: overlay[s.tone] }} aria-hidden="true" />

      <div className="relative grid min-h-[25rem] items-center gap-6 p-6 text-white sm:min-h-[22rem] sm:px-16 sm:py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-20 lg:py-12">
        {/* key restarts the entrance animation each time the slide comes back */}
        <div key={active ? "on" : "off"} className={cn("max-w-xl", active && "promo-in")}>
          <p className="inline-flex items-center gap-2 rounded-pill bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] backdrop-blur-sm">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full rounded-full bg-sun-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-sun-400" />
            </span>
            {s.eyebrow}
          </p>

          {/* Phones: the big number sits above the title */}
          <p className="mt-4 font-display text-5xl font-extrabold leading-none text-sun-400 lg:hidden">
            {s.highlight} <span className="text-lg font-bold uppercase tracking-wide text-white">{s.highlightSub}</span>
          </p>

          <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight text-white sm:text-4xl lg:mt-4">{s.title}</h3>
          <p className="mt-2 max-w-lg text-[15px] text-white/85 sm:text-base">{s.blurb}</p>

          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
            {s.urgency && <span className="inline-flex items-center gap-1.5 rounded-pill bg-sun-400 px-2.5 py-0.5 text-xs font-bold text-ink">{s.urgency}</span>}
            {s.validTill && <Countdown till={s.validTill} />}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button href={s.primary.href} size="lg" tabIndex={active ? 0 : -1}
              className="bg-white text-ink shadow-[0_10px_30px_-10px_rgb(0_0_0/0.5)] hover:-translate-y-0.5 hover:bg-sun-400 motion-reduce:hover:translate-y-0">
              {s.primary.label}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Button>
            {s.code ? <CodeChip code={s.code} tabIndex={active ? 0 : -1} /> : s.secondary && (
              <Button href={s.secondary.href} variant="ghost" size="lg" tabIndex={active ? 0 : -1} className="text-white hover:bg-white/15 hover:text-white">{s.secondary.label}</Button>
            )}
          </div>
        </div>

        {/* Desktop: the discount as a ticket-style badge */}
        <div aria-hidden="true" className="hidden lg:block">
          <div className="promo-float grid size-48 place-items-center rounded-full border-4 border-dashed border-white/40 bg-white/10 text-center backdrop-blur-md">
            <div>
              <p className="font-display text-6xl font-extrabold leading-none text-sun-400">{s.highlight}</p>
              <p className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-white">{s.highlightSub}</p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export function PromoCarousel({ slides }: { slides: PromoSlide[] }) {
  const track = React.useRef<HTMLUListElement>(null);
  const root = React.useRef<HTMLElement>(null);
  const [active, setActive] = React.useState(0);
  const [userPaused, setUserPaused] = React.useState(false);
  const [hovering, setHovering] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const [reduced, setReduced] = React.useState(false);
  const n = slides.length;
  const paused = userPaused || hovering || !visible || reduced;

  const goTo = React.useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const next = (i + n) % n;
    el.scrollTo({ left: next * el.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [n]);

  // Which slide is showing, from the scroll position (works for swipes too).
  React.useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Pause when off screen, in a background tab, or for reduced motion.
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const setR = () => setReduced(mq.matches);
    setR();
    mq.addEventListener("change", setR);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && document.visibilityState === "visible"), { threshold: 0.3 });
    if (root.current) io.observe(root.current);
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => { mq.removeEventListener("change", setR); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  React.useEffect(() => {
    if (paused || n < 2) return;
    const t = window.setTimeout(() => goTo(active + 1), INTERVAL);
    return () => window.clearTimeout(t);
  }, [active, paused, n, goTo]);

  if (n === 0) return null;

  return (
    <section ref={root} aria-roledescription="carousel" aria-label="Offers and deals" className="pt-2 sm:pt-4"
      onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setHovering(true)} onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHovering(false); }}>
      <div className="container-x">
        <div className="relative">
          <ul ref={track} className="flex snap-x snap-mandatory overflow-x-auto rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-live={paused ? "polite" : "off"}>
            {slides.map((s, i) => <Slide key={s.id} s={s} i={i} n={n} active={i === active} />)}
          </ul>

          {n > 1 && (
            <>
              <ArrowButton dir={-1} onClick={() => goTo(active - 1)} />
              <ArrowButton dir={1} onClick={() => goTo(active + 1)} />
            </>
          )}
        </div>

        {n > 1 && (
          <div className="mt-3 flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5" role="group" aria-label="Choose a slide">
              {slides.map((s, i) => (
                <button key={s.id} type="button" onClick={() => goTo(i)} aria-label={`Show slide ${i + 1}: ${s.title}`} aria-current={i === active ? "true" : undefined}
                  className="group grid h-8 place-items-center px-0.5">
                  <span className={cn("block h-2 overflow-hidden rounded-pill transition-all duration-base", i === active ? "w-10 bg-ink/15" : "w-2 bg-ink/25 group-hover:bg-ink/50")}>
                    {i === active && (
                      <span key={`${active}-${paused}`} className="block h-full rounded-pill bg-sky-600"
                        style={reduced ? { width: "100%" } : { animation: `promo-progress ${INTERVAL}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }} />
                    )}
                  </span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setUserPaused((p) => !p)} aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
              className="grid size-8 place-items-center rounded-pill border border-line bg-paper text-ink-soft hover:border-sky-500 hover:text-ink">
              {userPaused || reduced
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ArrowButton({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={dir === 1 ? "Next offer" : "Previous offer"}
      className={cn("absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-card-hover backdrop-blur transition-transform duration-fast hover:scale-105 sm:grid",
        dir === 1 ? "right-3" : "left-3")}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d={dir === 1 ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
