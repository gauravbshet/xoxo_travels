import type { Metadata } from "next";
import { Button, CopyCode, EmptyState } from "@/components/ui";
import { Block, ContentHero, Faq, Steps } from "@/components/content/blocks";
import { EndingSoon } from "@/components/home/ending-soon";
import { appliesToLabel, getActiveOffers } from "@/lib/data/offers";
import { scopeHref } from "@/lib/data/promos";
import { formatINR } from "@/lib/format";
import { pageMeta } from "@/lib/metadata";

export const metadata: Metadata = pageMeta({ title: "Offers & coupon codes", description: "Live discount codes for holiday packages and group trips. Copy a code and apply it at checkout.", path: "/offers" });

const till = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function OffersPage() {
  const offers = await getActiveOffers(24);
  return (
    <>
      <ContentHero eyebrow="Offers & coupons" title="Save on your next trip" blurb="Live codes for holidays and group trips. Copy one, apply it at checkout. One code per booking.">
        <Button href="/holidays" className="bg-white text-ink hover:bg-sun-400">Browse holidays</Button>
        <Button href="/group-trips" variant="ghost" className="text-white hover:bg-white/15 hover:text-white">Group trips</Button>
      </ContentHero>

      <div className="container-x">
        <Block title="Live offers" id="live">
          {offers.length === 0 ? (
            <EmptyState title="No live offers right now" blurb="New codes go live often. Check back soon." action={{ label: "Browse holidays", href: "/holidays" }} />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((o) => (
                <li key={o.id} className="flex flex-col overflow-hidden rounded-xl border border-line/70 bg-paper shadow-card">
                  <div className="flex items-center justify-between gap-3 bg-[linear-gradient(115deg,var(--color-ink),#1b2640)] px-5 py-4 text-white">
                    <p className="font-display text-4xl font-extrabold leading-none text-sun-400">{o.kind === "percent" ? `${o.value}%` : formatINR(o.value)}<span className="ml-1.5 text-sm font-bold uppercase tracking-wide text-white">off</span></p>
                    <EndingSoon till={o.validTill} />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sky-700">{appliesToLabel[o.appliesTo]}</p>
                    <h3 className="mt-1 text-lg leading-snug">{o.title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{o.blurb}</p>
                    <ul className="mt-3 space-y-0.5 text-xs text-ink-mute">
                      {o.minSpend && <li>Minimum spend {formatINR(o.minSpend)} before GST</li>}
                      {o.maxDiscount && <li>Save up to {formatINR(o.maxDiscount)}</li>}
                      {o.appliesTo === "group-trips" && o.kind === "flat" && <li>Taken off per seat</li>}
                      <li>Valid till {till.format(new Date(o.validTill))}</li>
                    </ul>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                      <CopyCode code={o.code} />
                      <Button href={scopeHref[o.appliesTo]} size="sm" variant="outline">Use it</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Block>

        <Block title="How to use a code" id="how">
          <Steps items={[
            ["Copy a code", "Tap the code on any offer to copy it."],
            ["Pick your trip", "Choose a holiday or group trip the offer covers."],
            ["Apply at checkout", "Paste it under “Have a coupon code?” in the order summary."],
            ["See it in the total", "The discount comes off before GST is added."],
          ]} />
        </Block>

        <Block title="Questions" id="faq" className="pb-14">
          <Faq items={[
            ["Can I use more than one code?", "No. One code per booking. Pick the one that saves you the most; the order summary shows the saving before you pay."],
            ["Why was my code rejected?", "Each code says what it covers (for example international holidays only), any minimum spend, and its end date. The checkout message tells you which rule wasn't met."],
            ["Is the discount taken before or after GST?", "Before. GST is worked out on the discounted amount, so you save on the tax too."],
            ["Do codes work on group trips?", "Some do. Group trip codes are marked “Group trips”; flat group trip codes come off per seat."],
          ]} />
        </Block>
      </div>
    </>
  );
}
