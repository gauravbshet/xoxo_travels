import { Button, Reveal, Section } from "@/components/ui";
import { site } from "@/config/site";

export function VisaAndSupport() {
  const tel = `tel:${site.phone.replace(/\s/g, "")}`;
  return (
    <Section aria-label="Visa assistance and support">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Reveal>
          <article className="flex h-full flex-col rounded-lg border border-line/70 bg-paper p-5 shadow-card sm:p-8">
            <span className="grid size-12 place-items-center rounded-md bg-leaf-50 text-leaf-600" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="2.5" /><path d="M8.5 17c.8-1.8 2-2.5 3.5-2.5s2.7.7 3.5 2.5" /></svg>
            </span>
            <h2 className="mt-4 text-[1.75rem] leading-tight sm:mt-5 sm:text-3xl">Visa, handled</h2>
            <p className="mt-2 text-ink-soft">Book an international package and we take the paperwork off your plate.</p>
            <ol className="mt-4 space-y-2.5 text-sm sm:mt-5 sm:space-y-3 sm:text-[15px]">
              {[
                ["Checklist", "We send the exact documents your destination needs."],
                ["Filing", "We fill and submit the application for you."],
                ["Tracking", "You see the status in your bookings, and we chase delays."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="tabular grid size-7 shrink-0 place-items-center rounded-pill bg-leaf-600 text-xs font-bold text-white">{i + 1}</span>
                  <p><strong className="text-ink">{t}.</strong> <span className="text-ink-soft">{d}</span></p>
                </li>
              ))}
            </ol>
            <div className="mt-auto pt-6"><Button href="/visa" variant="outline">How visa assistance works</Button></div>
          </article>
        </Reveal>

        <Reveal delay={80}>
          <article className="flex h-full flex-col rounded-lg bg-sky-600 p-5 text-white shadow-float sm:p-8">
            <span className="grid size-12 place-items-center rounded-md bg-white/15" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-2v-6h4M4 12v5a2 2 0 0 0 2 2h2v-6H4" /></svg>
            </span>
            <h2 className="mt-4 text-[1.75rem] leading-tight sm:mt-5 sm:text-3xl">Someone&rsquo;s always on</h2>
            <p className="mt-2 text-white">Before you book, during the trip, and after. A real person on the other end, 24×7.</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-white/90">Typical reply</dt><dd className="font-bold">Under 5 minutes</dd></div>
              <div><dt className="text-white/90">On-trip emergencies</dt><dd className="font-bold">Priority line</dd></div>
            </dl>
            <div className="mt-auto grid gap-2.5 pt-5 sm:flex sm:flex-wrap sm:gap-3 sm:pt-6">
              <Button href={site.social.whatsapp} variant="secondary" className="bg-white text-sky-700 hover:bg-white/90">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.2L4 20Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
                WhatsApp us
              </Button>
              <Button href={tel} variant="ghost" className="text-white hover:bg-white/15 hover:text-white">Call {site.phone}</Button>
            </div>
          </article>
        </Reveal>
      </div>
    </Section>
  );
}
