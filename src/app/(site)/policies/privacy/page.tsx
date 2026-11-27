import type { Metadata } from "next";
import { Block, ContentHero, DraftNotice, Prose } from "@/components/content/blocks";
import { site } from "@/config/site";
import { pageMeta } from "@/lib/metadata";

export const metadata: Metadata = pageMeta({ title: "Privacy policy", description: "What personal data XOXO Travels collects, why, and the choices you have.", path: "/policies/privacy" });

/* Written to match what the site actually does. Draft: needs legal review (including
   India's Digital Personal Data Protection Act, 2023) before launch. */
export default function PrivacyPolicy() {
  return (
    <>
      <ContentHero eyebrow="Policies" title="Privacy policy" blurb="What we collect, why we need it, and how you stay in control." />
      <div className="container-x">
        <Block className="pb-14">
          <DraftNotice />
          <Prose>
            <h2>What we collect</h2>
            <ul>
              <li><strong>Account:</strong> your name, email and phone, through our sign-in provider (Clerk).</li>
              <li><strong>Bookings:</strong> traveler names and ages, contact details, the trip, dates, any extras you request, and payment status.</li>
              <li><strong>Payments:</strong> handled by Razorpay. We receive a payment reference and status; we never see or store your card, UPI or bank details.</li>
              <li><strong>Profile (optional):</strong> display name, photo, city, date of birth, gender, interests and languages, if you set up a travel profile.</li>
              <li><strong>ID verification (optional):</strong> an image of a government ID, seen only by our review team and deleted as soon as it is reviewed. We keep only the result.</li>
              <li><strong>Find a Partner (optional):</strong> your declared trips, and your location rounded to about 1 km, used only to measure distance. Other travelers see your city, never your location.</li>
              <li><strong>Messages:</strong> chats and photos with travelers you’ve connected with, stored so the conversation is there when you return.</li>
              <li><strong>On your device:</strong> packages you’ve viewed, kept in your own browser to suggest trips. It isn’t sent to us.</li>
            </ul>
            <h2>Why we use it</h2>
            <ul>
              <li>To take and manage bookings, process payments and refunds, and issue GST invoices.</li>
              <li>To contact you about your trip and send booking emails.</li>
              <li>To run Find a Partner safely, including handling reports and blocks.</li>
              <li>To meet legal, tax and accounting obligations.</li>
            </ul>
            <p>We don’t sell your personal data.</p>
            <h2>Who we share it with</h2>
            <p>Only the services that run the site for us, under their own data agreements: sign-in (Clerk), payments (Razorpay), email (Resend), file storage (Cloudflare R2), realtime chat (Ably), hosting and database providers, and the hotels, transport and guides needed to deliver your trip.</p>
            <h2>How long we keep it</h2>
            <p>Booking and invoice records are kept as long as tax law requires. ID images are deleted after review. You can delete your profile photo at any time, and ask us to delete your account.</p>
            <h2>Your choices and rights</h2>
            <ul>
              <li>Turn Find a Partner visibility on or off from your profile at any time.</li>
              <li>Ask for a copy of your data, a correction, or deletion of your account by writing to <strong>{site.email}</strong>.</li>
              <li>Block or report anyone from their card, request or chat.</li>
            </ul>
            <h2>Contact</h2>
            <p>{site.name}, {site.address}. Email <strong>{site.email}</strong>.</p>
          </Prose>
        </Block>
      </div>
    </>
  );
}
