import Link from "next/link";
import { Carousel, Reveal, Section, SectionHeader, VerifiedBadge } from "@/components/ui";
import { getFeaturedReviews, type Review } from "@/lib/data/reviews";

const month = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });

export async function Testimonials() {
  const reviews = await getFeaturedReviews(6);
  return (
    <Section aria-labelledby="reviews-heading" className="bg-paper">
      <SectionHeader
        id="reviews-heading"
        eyebrow="Reviews"
        title="Said after the trip, not before"
        blurb="Every review is tied to a completed booking."
        action={{ label: "All reviews", href: "/reviews" }}
      />
      <Carousel label="Traveler reviews">
        {reviews.map((r, i) => (
          <Reveal as="li" key={r.id} delay={i * 60} className="w-[85vw] shrink-0 snap-start sm:w-[48vw] lg:w-[calc((100%-2rem)/3)]">
            <ReviewCard r={r} />
          </Reveal>
        ))}
      </Carousel>
    </Section>
  );
}

function ReviewCard({ r }: { r: Review }) {
  const initials = r.name.split(/\s|&/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("");
  return (
    <article className="flex h-full flex-col rounded-lg border border-line/70 bg-cream p-5">
      <div className="flex items-center gap-1" aria-label={`${r.rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className={i < r.rating ? "text-sun-500" : "text-line"} fill="currentColor">
            <path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6L5.8 21l1.4-7L2 9.3l7-.8L12 2Z" />
          </svg>
        ))}
      </div>
      <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink">
        “{r.text}”
      </blockquote>
      <footer className="mt-5 flex items-center gap-3 border-t border-line/70 pt-4">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-pill bg-sky-100 font-display text-sm font-bold text-sky-700">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">{r.name} {r.verified && <VerifiedBadge className="py-0.5" />}</p>
          <p className="truncate text-xs text-ink-mute">
            {r.city} · <Link href={r.tripHref} className="font-semibold text-sky-700 hover:underline">{r.trip}</Link> · {month.format(new Date(`${r.travelled}-01`))}
          </p>
        </div>
      </footer>
    </article>
  );
}
