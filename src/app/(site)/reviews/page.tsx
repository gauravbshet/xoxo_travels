import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, VerifiedBadge } from "@/components/ui";
import { Block, ContentHero } from "@/components/content/blocks";
import { getApprovedReviews } from "@/lib/data/reviews";
import { pageMeta } from "@/lib/metadata";

export const metadata: Metadata = pageMeta({ title: "Traveler reviews", description: "What travelers say after their XOXO trips. Every review comes from a completed booking.", path: "/reviews" });

const month = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });

function Stars({ n }: { n: number }) {
  return (
    <span className="flex" role="img" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={i < n ? "text-sun-500" : "text-line"}><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6L5.8 21l1.4-7L2 9.3l7-.8L12 2Z" /></svg>
      ))}
    </span>
  );
}

export default async function ReviewsPage() {
  const reviews = await getApprovedReviews(60);
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  return (
    <>
      <ContentHero eyebrow="Reviews" title="Said after the trip, not before" blurb="Every review here comes from a traveler who completed a booking with us, and our team checks each one before it goes live." />

      <div className="container-x">
        <Block className="pb-14">
          {reviews.length === 0 ? (
            <EmptyState title="No reviews yet" blurb="Travelers can review a holiday after it ends." action={{ label: "Browse holidays", href: "/holidays" }} />
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-line/70 bg-paper p-5 shadow-card">
                <p className="font-display text-4xl font-extrabold text-ink">{avg.toFixed(1)}</p>
                <div><Stars n={Math.round(avg)} /><p className="text-sm text-ink-soft">from {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p></div>
              </div>
              <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
                {reviews.map((r) => (
                  <li key={r.id} className="break-inside-avoid rounded-xl border border-line/70 bg-paper p-5 shadow-card">
                    <Stars n={r.rating} />
                    <blockquote className="mt-3 text-[15px] leading-relaxed text-ink">“{r.text}”</blockquote>
                    <footer className="mt-4 border-t border-line/70 pt-3 text-sm">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">{r.name}{r.verified && <VerifiedBadge />}</p>
                      <p className="text-ink-mute">{[r.city, r.travelled ? month.format(new Date(`${r.travelled}-01`)) : null].filter(Boolean).join(" · ")}</p>
                      <Link href={r.tripHref} className="mt-1 inline-block font-semibold text-sky-700 hover:underline">{r.trip}</Link>
                    </footer>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Block>
      </div>
    </>
  );
}
