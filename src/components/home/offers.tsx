import Link from "next/link";
import { cn } from "@/lib/cn";
import { appliesToLabel, getActiveOffers, type Offer } from "@/lib/data/offers";
import { scopeHref } from "@/lib/data/promos";
import { formatINR } from "@/lib/format";
import { EndingSoon } from "./ending-soon";

/* Full-width offers billboard, right under the hero: a slim tagline ticker over a large row of offer
   plates, both moving right to left forever. Pure CSS (see .marquee-track in
   globals.css): each track holds its content twice and slides by -50%, so the
   loop is seamless. Hover or keyboard focus pauses it; reduced-motion users get
   a still, swipeable row instead. */

const TAGLINES = [
  "🔥 Mega sale – limited time offer",
  "Exclusive deals – save more today",
  "Special discounts – don't miss out",
  "Best prices – book your favourites",
  "Limited period offer – grab it now",
];
const BADGES = ["🔥 Mega sale", "Exclusive", "Special discount", "Best price", "Limited period"];
const MIN_PLATES = 6; // enough to fill very wide screens before the copy starts

const till = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("twinkle size-4 shrink-0 text-sun-400", className)}>
      <path fill="currentColor" d="M12 2l1.9 6.6L20.5 10.5l-6.6 1.9L12 19l-1.9-6.6L3.5 10.5l6.6-1.9L12 2Z" />
    </svg>
  );
}

function Plate({ o, badge, copy }: { o: Offer; badge: string; copy: boolean }) {
  const amount = o.kind === "percent" ? `${o.value}%` : formatINR(o.value);
  return (
    <Link
      href={scopeHref[o.appliesTo]}
      tabIndex={copy ? -1 : undefined}
      aria-label={copy ? undefined : `${o.title}. Code ${o.code}. ${appliesToLabel[o.appliesTo]}, valid till ${till.format(new Date(o.validTill))}.`}
      className={cn(
        "group/plate relative flex w-[20rem] shrink-0 items-center gap-4 overflow-hidden rounded-xl border border-white/15 bg-white/[0.07] p-4 text-white backdrop-blur-sm sm:w-[30rem] sm:gap-5 sm:p-5",
        "transition-[background-color,border-color,transform] duration-base ease-out-soft hover:-translate-y-0.5 hover:border-sun-400/70 hover:bg-white/[0.13] motion-reduce:hover:translate-y-0",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sun-400",
      )}
    >
      {/* soft gold glow behind the number */}
      <span aria-hidden="true" className="pointer-events-none absolute -left-10 top-1/2 size-32 -translate-y-1/2 rounded-full bg-sun-400/20 blur-2xl" />
      <div className="relative shrink-0 text-center">
        <p className="font-display text-[2.6rem] font-extrabold leading-none text-sun-400 sm:text-5xl">{amount}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/85">{o.appliesTo === "group-trips" && o.kind === "flat" ? "off / seat" : "off"}</p>
      </div>
      <div className="relative min-w-0 flex-1 border-l border-white/15 pl-4 sm:pl-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-pill bg-coral-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">{badge}</span>
          <EndingSoon till={o.validTill} className="px-2 py-0.5 text-[10px]" />
        </div>
        <p className="mt-1.5 line-clamp-2 font-display text-base font-bold leading-snug sm:text-lg">{o.title}</p>
        <p className="mt-0.5 truncate text-xs text-white/75">{appliesToLabel[o.appliesTo]} · till {till.format(new Date(o.validTill))}{o.minSpend ? ` · min ${formatINR(o.minSpend)}` : ""}</p>
        <p className="mt-2 inline-flex items-center gap-2 text-xs text-white/80">
          Code
          <span className="rounded-md border border-dashed border-sun-400/70 bg-sun-400/10 px-2 py-0.5 font-mono text-[13px] font-bold tracking-wider text-sun-400">{o.code}</span>
        </p>
      </div>
      <span aria-hidden="true" className="relative grid size-9 shrink-0 place-items-center rounded-full bg-white/10 transition-colors duration-fast group-hover/plate:bg-sun-400 group-hover/plate:text-ink">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </Link>
  );
}

export async function Offers() {
  const offers = await getActiveOffers(6);
  if (offers.length === 0) return null;

  // Repeat the offers until there are enough plates to cover a wide screen.
  const plates = Array.from({ length: Math.max(MIN_PLATES, offers.length) }, (_, i) => ({ o: offers[i % offers.length], badge: BADGES[i % BADGES.length], key: i }));
  const tickerItems = [...TAGLINES, ...TAGLINES];

  const pause = "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]";

  return (
    <section aria-labelledby="offers-heading" className="group relative mt-2 mb-2 overflow-x-clip sm:mt-4">
      <h2 id="offers-heading" className="sr-only">Trending offers</h2>

      {/* Tagline ticker */}
      <div className="relative overflow-hidden bg-[linear-gradient(90deg,var(--color-sun-500),var(--color-sun-400),var(--color-sun-500))] py-2 text-ink motion-reduce:overflow-x-auto">
        <ul className={cn("marquee-track", pause)} style={{ "--marquee-duration": "38s" } as React.CSSProperties}>
          {[0, 1].map((copy) => (
            <li key={copy} aria-hidden={copy === 1 || undefined} className={cn("flex shrink-0 items-center", copy === 1 && "motion-reduce:hidden")}>
              {tickerItems.map((t, i) => (
                <span key={i} className="flex items-center gap-4 pr-4 text-xs font-extrabold uppercase tracking-[0.16em] sm:text-sm">
                  {t}
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3 text-ink/70"><path fill="currentColor" d="M12 2l1.9 6.6L20.5 10.5l-6.6 1.9L12 19l-1.9-6.6L3.5 10.5l6.6-1.9L12 2Z" /></svg>
                </span>
              ))}
            </li>
          ))}
        </ul>
      </div>

      {/* Billboard */}
      <div className="relative overflow-hidden bg-[linear-gradient(115deg,var(--color-ink)_0%,#141d33_55%,#1b2640_100%)] py-6 sm:py-8">
        {/* decorative glows */}
        <span aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/4 size-72 rounded-full bg-sky-500/10 blur-3xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-[20%] size-80 rounded-full bg-sun-400/20 blur-3xl" />

        <div className="relative mb-4 flex items-center justify-between gap-3 px-4 sm:mb-5 sm:px-8">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/85">
            <Spark /> Trending offers <span className="hidden text-white/50 sm:inline">· tap a deal to use it</span>
          </p>
          <p className="hidden items-center gap-1.5 text-xs text-white/60 sm:flex">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
            Hover to pause
          </p>
        </div>

        {/* Edge fade keeps the billboard feeling endless */}
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] motion-reduce:overflow-x-auto">
          <ul aria-label="Current offers" className={cn("marquee-track py-1", pause)} style={{ "--marquee-duration": `${plates.length * 7}s` } as React.CSSProperties}>
            {[0, 1].map((copy) => (
              <li key={copy} aria-hidden={copy === 1 || undefined} className={cn("flex shrink-0 items-center", copy === 1 && "motion-reduce:hidden")}>
                {plates.map(({ o, badge, key }) => (
                  <span key={key} className="flex items-center">
                    <Plate o={o} badge={badge} copy={copy === 1} />
                    <Spark className="mx-4 size-5 sm:mx-6" />
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
