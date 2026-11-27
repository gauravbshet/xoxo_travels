import type { Metadata } from "next";
import { Button } from "@/components/ui";
import { Block, ContentHero } from "@/components/content/blocks";
import { site } from "@/config/site";
import { pageMeta } from "@/lib/metadata";

export const metadata: Metadata = pageMeta({ title: "About XOXO Travels", description: "Holiday packages, small-group trips and travel partners from a team that plans every trip like it's our own.", path: "/about" });

const pillars = [
  ["Holiday packages", "Flights, stays and sightseeing bundled into one price, with GST shown upfront and nothing hidden.", "/holidays"],
  ["Group trips", "Fixed dates, small groups and a leader who knows the place. Just turn up and travel.", "/group-trips"],
  ["Find a Partner", "Meet travelers heading the same way on the same dates, safely, with chat only after both say yes.", "/partners"],
] as const;

const values = [
  ["Honest prices", "The price you see is the price you pay, with GST added clearly and refunds that follow our written policy."],
  ["Real people", "WhatsApp, phone or email, before and during your trip. A person replies, not a bot."],
  ["Safety first", "Verified profiles, location kept to your city, and one-tap block and report."],
  ["Plan less", "We sweat the details (stays, transfers, visas) so the trip is the only thing on your mind."],
];

export default function AboutPage() {
  return (
    <>
      <ContentHero eyebrow="About us" title="Plan less. Travel more." blurb={`${site.name} started in ${site.address.split(",")[0]} with a simple idea: booking a great trip should take minutes, not weekends. We bundle the hard parts and leave you the fun ones.`}>
        <Button href="/holidays" className="bg-white text-ink hover:bg-sun-400">Find a trip</Button>
        <Button href="/support" variant="ghost" className="text-white hover:bg-white/15 hover:text-white">Talk to us</Button>
      </ContentHero>

      <div className="container-x">
        <Block title="What we do" id="what">
          <ul className="grid gap-4 md:grid-cols-3">
            {pillars.map(([t, d, href]) => (
              <li key={t}>
                <a href={href} className="group block h-full rounded-xl border border-line/70 bg-paper p-6 shadow-card transition-[transform,box-shadow] duration-base hover:-translate-y-1 hover:shadow-card-hover motion-reduce:hover:translate-y-0">
                  <p className="font-display text-xl font-bold text-ink">{t}</p>
                  <p className="mt-2 text-[15px] text-ink-soft">{d}</p>
                  <p className="mt-4 text-sm font-bold text-sky-700 group-hover:underline">Explore →</p>
                </a>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="What we stand for" id="values" className="pb-14">
          <ul className="grid gap-4 sm:grid-cols-2">
            {values.map(([t, d]) => (
              <li key={t} className="flex gap-4 rounded-xl border border-line/70 bg-paper p-5 shadow-card">
                <span aria-hidden="true" className="mt-1 size-3 shrink-0 rotate-45 rounded-[3px] bg-sun-400" />
                <span><span className="block font-display text-lg font-bold text-ink">{t}</span><span className="text-[15px] text-ink-soft">{d}</span></span>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-xl bg-[linear-gradient(115deg,var(--color-ink),#1b2640)] p-6 text-white sm:p-8">
            <p className="font-display text-2xl font-bold">Got a question or an idea for a trip?</p>
            <p className="mt-1 text-white/80">We’d love to hear it. {site.email} · {site.phone}</p>
            <Button href={site.social.whatsapp} className="mt-5 bg-white text-ink hover:bg-sun-400">Message us on WhatsApp</Button>
          </div>
        </Block>
      </div>
    </>
  );
}
