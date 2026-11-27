import type { Metadata } from "next";
import Link from "next/link";
import { Block, ContentHero, DraftNotice, Prose } from "@/components/content/blocks";
import { booking } from "@/config/booking";
import { site } from "@/config/site";
import { pageMeta } from "@/lib/metadata";

export const metadata: Metadata = pageMeta({ title: "Terms of use", description: "The terms for booking holidays and group trips, and for using Find a Partner, on XOXO Travels.", path: "/policies/terms" });

/* Draft terms matching how the site works. Needs legal review before launch. */
export default function Terms() {
  return (
    <>
      <ContentHero eyebrow="Policies" title="Terms of use" blurb="The agreement between you and XOXO Travels when you book or use the site." />
      <div className="container-x">
        <Block className="pb-14">
          <DraftNotice />
          <Prose>
            <h2>1. Using the site</h2>
            <p>You must be {booking.leadMinAge} or older to create an account and book. Keep your sign-in secure; you’re responsible for activity on your account.</p>
            <h2>2. Bookings and prices</h2>
            <ul>
              <li>Prices are per person in Indian rupees. GST at {Math.round(booking.gstRate * 100)}% is added on top and shown before you pay.</li>
              <li>A booking is confirmed only when payment succeeds. Unpaid bookings may be released.</li>
              <li>Group trip seats are held for {booking.seatHoldMinutes} minutes while you pay; after that they may go to someone else.</li>
              <li>Departures need at least {booking.minLeadDays} days’ notice, and a booking can include up to {booking.maxTravelers} travelers.</li>
              <li>Traveler names must match government ID. We aren’t responsible for denied boarding or entry caused by incorrect details or documents.</li>
            </ul>
            <h2>3. Coupons</h2>
            <p>One coupon per booking. Each has its own conditions (what it covers, minimum spend, end date and usage limit). Coupons have no cash value.</p>
            <h2>4. Cancellations and refunds</h2>
            <p>Refunds follow our <Link href="/policies/cancellation" className="font-semibold text-sky-700 underline">cancellation policy</Link>. If we cancel a trip, you receive a full refund.</p>
            <h2>5. Visas and documents</h2>
            <p>Valid passports, visas and other documents are the traveler’s responsibility. Our visa assistance helps you apply but cannot guarantee an embassy’s decision.</p>
            <h2>6. Find a Partner</h2>
            <ul>
              <li>Be honest in your profile. Fake profiles, harassment, spam and scams are not allowed and may lead to removal.</li>
              <li>Meeting other travelers is your own decision and risk. Meet in public places and share your plans with someone you trust.</li>
              <li>We may review reports, hide profiles and remove accounts that break these rules.</li>
            </ul>
            <h2>7. Our responsibility</h2>
            <p>We take care in planning your trip and choosing partners. Some services are delivered by third parties (hotels, airlines, transport and guides) under their own terms. Our liability is limited to the amount you paid us for the affected booking, except where the law doesn’t allow such a limit.</p>
            <h2>8. Changes and contact</h2>
            <p>We may update these terms; the version on this page applies to new bookings. Questions: <strong>{site.email}</strong>, {site.address}.</p>
          </Prose>
        </Block>
      </div>
    </>
  );
}
