import type { Metadata } from "next";
import { Button } from "@/components/ui";
import { Block, ContentHero, Faq, Steps } from "@/components/content/blocks";
import { site } from "@/config/site";
import { pageMeta } from "@/lib/metadata";

export const metadata: Metadata = pageMeta({ title: "Visa assistance", description: "Document checklists, application filing and tracking for international trips booked with XOXO Travels.", path: "/visa" });

const documents = [
  ["Passport", "Valid for at least 6 months after your return date, with two blank pages."],
  ["Photographs", "Recent passport-size photos to the destination's size and background rules."],
  ["Bank statements", "Usually the last 3 to 6 months, showing you can cover the trip."],
  ["Income proof", "Recent salary slips or income tax returns; a business registration if self-employed."],
  ["Travel bookings", "Your confirmed XOXO itinerary, hotel stays and flights (we provide these)."],
  ["Cover letter", "A short letter on your trip and return plans. We give you a template."],
];

export default function VisaPage() {
  return (
    <>
      <ContentHero eyebrow="Visa assistance" title="Visas, handled for you" blurb="Book an international holiday and we take the paperwork off your plate: the exact checklist, filing, and tracking until the visa is in your hand.">
        <Button href={site.social.whatsapp} className="bg-white text-ink hover:bg-sun-400">Ask on WhatsApp</Button>
        <Button href="/holidays?region=international" variant="ghost" className="text-white hover:bg-white/15 hover:text-white">International holidays</Button>
      </ContentHero>

      <div className="container-x">
        <Block title="How it works" id="how">
          <Steps items={[
            ["Book your trip", "Choose an international package, or tick “Visa assistance” at checkout."],
            ["Get your checklist", "We send the exact documents your destination and passport need."],
            ["We file it", "We fill and submit the application and book any appointment."],
            ["Track to the end", "You see progress in your bookings, and we chase any delay."],
          ]} />
        </Block>

        <Block title="Documents you'll usually need" id="documents">
          <p className="mb-4 max-w-2xl text-ink-soft">Requirements differ by country, passport and visa type, and change from time to time. This is the common core; we confirm the precise list for your trip before you collect anything.</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map(([t, d]) => (
              <li key={t} className="flex gap-3 rounded-xl border border-line/70 bg-paper p-4 shadow-card">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-sky-600"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span><span className="block font-semibold text-ink">{t}</span><span className="text-sm text-ink-soft">{d}</span></span>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Questions" id="faq" className="pb-14">
          <Faq items={[
            ["How early should I apply?", "Start as soon as you book. Most tourist visas take one to four weeks, and some destinations need an in-person appointment; earlier gives you room for any extra documents."],
            ["Do you guarantee the visa?", "No one can. The decision is always the embassy's. We make sure your application is complete and correct, which is what gives you the best chance."],
            ["Is visa assistance included in the package price?", "Packages that list “Visa processing” include our service. Government visa fees are paid separately and passed through at cost."],
            ["What if my visa is refused?", "Tell us straight away. Our cancellation policy applies, and we help you with any re-application where it makes sense."],
            ["Can you help if I booked flights elsewhere?", "Yes, as long as the holiday is booked with us. We'll use your own flight details in the application."],
          ]} />
        </Block>
      </div>
    </>
  );
}
