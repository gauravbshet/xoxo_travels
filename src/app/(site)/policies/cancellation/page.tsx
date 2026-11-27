import type { Metadata } from "next";
import Link from "next/link";
import { Block, ContentHero, Prose } from "@/components/content/blocks";
import { booking } from "@/config/booking";
import { site } from "@/config/site";
import { pageMeta } from "@/lib/metadata";

export const metadata: Metadata = pageMeta({ title: "Cancellation & refund policy", description: "How refunds work when you cancel an XOXO Travels booking, by days before departure.", path: "/policies/cancellation" });

/* The table comes straight from src/config/booking.ts, the same rules checkout and admin refunds use. */
export default function CancellationPolicy() {
  return (
    <>
      <ContentHero eyebrow="Policies" title="Cancellation & refunds" blurb="Simple, written rules: how much you get back depends only on how many days before departure you cancel." />
      <div className="container-x">
        <Block title="Refund by days before departure" id="table">
          <div className="max-w-2xl overflow-hidden rounded-xl border border-line/70 bg-paper shadow-card">
            <table className="w-full text-[15px]">
              <caption className="sr-only">Refund by days before departure</caption>
              <thead className="bg-cream-deep text-left text-xs font-bold uppercase tracking-[0.08em] text-ink-soft"><tr><th scope="col" className="p-3">When you cancel</th><th scope="col" className="p-3">Refund</th></tr></thead>
              <tbody className="divide-y divide-line/70">
                {booking.cancellation.map((c) => (
                  <tr key={c.label}><td className="p-3">{c.label}</td><td className={`p-3 font-semibold ${c.refund === 1 ? "text-sky-700" : c.refund === 0 ? "text-coral-700" : "text-ink"}`}>{c.outcome}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>
        <Block className="pb-14">
          <Prose>
            <h2>How it works</h2>
            <ul>
              <li>The refund percentage applies to the full amount you paid, including GST.</li>
              <li>Days are counted to your departure date (for packages, the travel date you chose).</li>
              <li>To cancel, message us on WhatsApp or email <strong>{site.email}</strong> with your booking reference. We confirm the amount before we process it.</li>
              <li>We start refunds the same day; banks usually take 5 to 7 working days to show them.</li>
              <li>If we have to cancel a trip, for example for safety or too few travelers on a group departure, you get a full refund.</li>
              <li>Coupon discounts are not refunded as cash; the refund is worked out on what you actually paid.</li>
            </ul>
            <h2>Changes instead of cancelling</h2>
            <p>Date changes are often possible, subject to availability and any price difference. Ask us before cancelling; a change can cost less than the refund rules above.</p>
            <p>Questions? Visit the <Link href="/support" className="font-semibold text-sky-700 underline">help centre</Link>.</p>
          </Prose>
        </Block>
      </div>
    </>
  );
}
