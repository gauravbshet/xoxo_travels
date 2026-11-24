import { cn } from "@/lib/cn";
import { Badge, Button, Reveal, Section, VerifiedBadge } from "@/components/ui";
import { partnerPreviews } from "@/lib/data/community";

export function FindPartnerPromo() {
  return (
    <Section aria-labelledby="partner-heading" className="overflow-hidden">
      <div className="grid items-center gap-8 rounded-xl bg-ink px-5 py-8 text-white sm:gap-10 sm:px-10 sm:py-10 lg:grid-cols-2 lg:gap-16 lg:py-16">
        <Reveal>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-coral-500">Find a travel partner</p>
          <h2 id="partner-heading" className="text-[2rem] leading-tight sm:text-5xl">Going the same way? <span className="text-sun-400">Go together.</span></h2>
          <p className="mt-3 max-w-md text-[15px] text-white/80 sm:mt-4 sm:text-lg">
            Tell us where and when. We show travelers within 200 km of you heading to the same place on overlapping dates. Send a request, chat once they accept.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-white/85 sm:mt-6 sm:space-y-2.5 sm:text-[15px]">
            {[
              "Only your city is shown, never your exact location",
              "Chat opens after both of you accept",
              "Block or report anyone in one tap",
              "Verified badge after an ID check by our team",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-leaf-500"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-2.5 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
            <Button href="/partners" variant="coral" size="lg">Find travelers near me</Button>
            <Button href="/sign-in" variant="ghost" size="lg" className="text-white hover:bg-white/10 hover:text-white">Create a profile</Button>
          </div>
        </Reveal>

        {/* Fanned match cards */}
        <Reveal delay={120} className="relative mx-auto w-full max-w-sm sm:h-[22rem] lg:h-[26rem]">
          {partnerPreviews.map((p, i) => (
            <article
              key={p.name}
              aria-label={`${p.name} from ${p.city}, travelling to ${p.destination} ${p.dates}`}
              className={cn(
                "rounded-lg bg-paper p-4 text-ink shadow-card-hover sm:absolute sm:inset-x-0",
                // Phones: only the front card, in flow. Fanned stack from sm up.
                i === 0 && "hidden sm:block sm:top-0 sm:-rotate-3 sm:scale-[0.94] sm:opacity-70",
                i === 1 && "relative sm:top-10 sm:z-10",
                i === 2 && "hidden sm:block sm:top-[5.5rem] sm:rotate-2 sm:scale-[0.97] sm:opacity-85 lg:top-24",
              )}
            >
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-pill bg-sky-100 font-display text-lg font-bold text-sky-700">{p.name[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold">{p.name} {p.verified && <VerifiedBadge />}</p>
                  <p className="text-sm text-ink-soft">{p.city} · <span className="tabular">{p.distanceKm} km</span> from you</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-md bg-cream px-3 py-2 text-sm">
                <span><span className="text-ink-mute">To </span><strong>{p.destination}</strong></span>
                <span className="tabular font-semibold">{p.dates}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.interests.map((t) => <Badge key={t}>{t}</Badge>)}
              </div>
              <div className="mt-4 flex gap-2">
                <span className="inline-flex h-10 flex-1 items-center justify-center rounded-pill bg-sky-600 text-sm font-bold text-white">Send request</span>
                <span className="inline-flex h-10 items-center justify-center rounded-pill border border-line px-4 text-sm font-bold text-ink-soft">Profile</span>
              </div>
            </article>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
