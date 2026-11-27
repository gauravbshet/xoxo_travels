import type { Metadata } from "next";
import Link from "next/link";
import { Block, ContentHero, Faq } from "@/components/content/blocks";
import { site } from "@/config/site";
import { booking } from "@/config/booking";
import { pageMeta } from "@/lib/metadata";

export const metadata: Metadata = pageMeta({ title: "Help centre", description: "Answers on booking, payments, cancellations and travel partners, and how to reach the XOXO Travels team.", path: "/support" });

const tel = `tel:${site.phone.replace(/\s/g, "")}`;
const slabs = booking.cancellation.map((c) => `${c.label}: ${c.outcome.toLowerCase()}`).join("; ");

const contact = [
  { title: "WhatsApp", body: "Fastest. Usually under 5 minutes.", cta: "Chat now", href: site.social.whatsapp, icon: "M4 20l1.3-3.9A8 8 0 1 1 8 19.2L4 20Z" },
  { title: "Call us", body: `${site.phone} · 9 am to 9 pm, every day`, cta: "Call", href: tel, icon: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" },
  { title: "Email", body: `${site.email} · replies within a day`, cta: "Write to us", href: `mailto:${site.email}`, icon: "M4 6h16v12H4zM4 7l8 6 8-6" },
];

export default function SupportPage() {
  return (
    <>
      <ContentHero eyebrow="Help centre" title="How can we help?" blurb="Quick answers below, and real people on WhatsApp, phone and email before, during and after your trip." />

      <div className="container-x">
        <Block title="Talk to us" id="contact">
          <ul className="grid gap-4 sm:grid-cols-3">
            {contact.map((c) => (
              <li key={c.title} className="flex flex-col rounded-xl border border-line/70 bg-paper p-5 shadow-card">
                <span className="grid size-11 place-items-center rounded-md bg-sky-50 text-sky-700" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
                </span>
                <p className="mt-3 font-display text-lg font-bold text-ink">{c.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{c.body}</p>
                <a href={c.href} className="mt-auto pt-4 text-sm font-bold text-sky-700 hover:underline">{c.cta} →</a>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-coral-50 px-4 py-3 text-sm text-ink"><strong className="text-coral-700">On a trip and need urgent help?</strong> Call us any time; on-trip emergencies go to a priority line.</p>
        </Block>

        <Block title="Booking and payment" id="booking">
          <Faq items={[
            ["How do I book?", "Open a holiday or group trip, choose your date and travelers, and continue to checkout. You'll add traveler details, apply any coupon, and pay securely through Razorpay."],
            ["Which payment methods can I use?", "UPI, debit and credit cards, netbanking and wallets, through Razorpay. We never see or store your card details."],
            ["When is my booking confirmed?", "As soon as payment succeeds. You'll see the confirmation page, get an email, and find the booking under My bookings."],
            ["Where is my GST invoice?", <>Open <Link href="/account/bookings" className="font-semibold text-sky-700 underline">My bookings</Link> and choose “View GST invoice” on a paid booking. You can save it as a PDF from there.</>],
            ["My payment went through but the booking says pending.", "Give it a few minutes; Razorpay confirms to us directly as a backup. If it still shows pending, message us with your booking reference and we'll sort it."],
          ]} />
        </Block>

        <Block title="Changes, cancellations and refunds" id="cancel">
          <Faq items={[
            ["What is the cancellation policy?", <>Refunds depend on how many days before departure you cancel: {slabs}. Full details are on the <Link href="/policies/cancellation" className="font-semibold text-sky-700 underline">cancellation policy</Link>.</>],
            ["How do I cancel?", "Message us on WhatsApp or email with your booking reference. We confirm the refund amount before processing it."],
            ["How long do refunds take?", "We start the refund the same day. Banks usually take 5 to 7 working days to show it."],
            ["Can I change my travel date?", "Often, yes, subject to availability and any difference in price. Contact us as early as you can."],
          ]} />
        </Block>

        <Block title="Find a Partner and safety" id="partners" className="pb-14">
          <Faq items={[
            ["Who can see my profile?", "Only signed-in travelers heading to the same place on overlapping dates, and only if you turn on “Show me in Find a Partner”. They see your name, photo, age and city, never your exact location."],
            ["How do I block or report someone?", "Use “Report or block” on their card, request or chat. Blocking hides you from each other straight away and closes any chat. Reports go to our team."],
            ["What does the Verified badge mean?", "That traveler has had a government ID checked by our team. We delete the ID file as soon as it's reviewed."],
          ]} />
        </Block>
      </div>
    </>
  );
}
