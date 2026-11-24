import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, Rail, VerifiedBadge } from "@/components/ui";
import { Gallery } from "@/components/packages/gallery";
import { Itinerary } from "@/components/packages/itinerary";
import { BookingBox, MobileBookBar } from "@/components/packages/booking-box";
import { PackageCard } from "@/components/packages/package-card";
import { CompareToggle } from "@/components/packages/compare-toggle";
import { getAllPackageSlugs, getPackageDetail, getPackageReviews, getSimilarPackages } from "@/lib/data/package-details";
import { booking } from "@/config/booking";
import { formatDuration, formatINR } from "@/lib/format";
import { pageMeta } from "@/lib/metadata";
import { siteUrl } from "@/lib/site-url";
import type { Inclusion } from "@/lib/types";

export async function generateStaticParams() {
  return (await getAllPackageSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/holidays/[slug]">) {
  const res = await getPackageDetail((await params).slug);
  if (!res) return { title: "Package" };
  const { pkg } = res;
  return pageMeta({
    title: `${pkg.title} · ${formatDuration(pkg.nights, pkg.days)}`,
    description: `${pkg.highlights.join(", ")}. From ${formatINR(pkg.price)} per person. Rated ${pkg.rating.toFixed(1)} by ${pkg.reviewCount} travelers.`,
    path: `/holidays/${pkg.slug}`,
    image: false,
  });
}

const inclusionLabel: Record<Inclusion, string> = {
  flights: "Return flights", hotel: "Hotel stays", meals: "Daily breakfast and listed meals", transfers: "Airport and inter-city transfers", sightseeing: "Sightseeing with entry tickets", visa: "Visa processing",
};

const sections = [
  ["overview", "Overview"], ["itinerary", "Itinerary"], ["inclusions", "What's included"], ["stays", "Stays"], ["policy", "Cancellation"], ["reviews", "Reviews"],
] as const;

export default async function PackagePage({ params }: PageProps<"/holidays/[slug]">) {
  const { slug } = await params;
  const res = await getPackageDetail(slug);
  if (!res) notFound();
  const { pkg, detail } = res;
  const [reviews, similar] = await Promise.all([getPackageReviews(slug), getSimilarPackages(pkg)]);
  const off = pkg.listPrice ? Math.round((1 - pkg.price / pkg.listPrice) * 100) : 0;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: pkg.title,
      description: pkg.highlights.join(". "),
      image: pkg.image.src,
      touristType: pkg.themes,
      itinerary: { "@type": "ItemList", itemListElement: detail.itinerary.map((d) => ({ "@type": "ListItem", position: d.day, name: d.title })) },
      offers: { "@type": "Offer", price: pkg.price, priceCurrency: "INR", availability: "https://schema.org/InStock", url: `${siteUrl}/holidays/${pkg.slug}` },
      ...(pkg.reviewCount > 0 && { aggregateRating: { "@type": "AggregateRating", ratingValue: pkg.rating, reviewCount: pkg.reviewCount } }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Holidays", item: `${siteUrl}/holidays` },
        { "@type": "ListItem", position: 2, name: pkg.destinationName, item: `${siteUrl}/destinations/${pkg.destinationSlug}` },
        { "@type": "ListItem", position: 3, name: pkg.title, item: `${siteUrl}/holidays/${pkg.slug}` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="container-x pb-28 pt-6 sm:pt-8 lg:pb-16">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-mute">
          <Link href="/holidays" className="inline-block py-2 hover:text-ink">Holidays</Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/destinations/${pkg.destinationSlug}`} className="inline-block py-2 hover:text-ink">{pkg.destinationName}</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-ink-soft">{pkg.title}</span>
        </nav>

        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Badge tone={pkg.region === "domestic" ? "blue" : "green"}>{pkg.region === "domestic" ? "India" : "International"}</Badge>
              <Badge>{formatDuration(pkg.nights, pkg.days)}</Badge>
              {pkg.bestseller && <Badge tone="yellow">Bestseller</Badge>}
              {off > 0 && <Badge tone="coral">{off}% off</Badge>}
            </div>
            <h1 className="text-3xl sm:text-5xl">{pkg.title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
              {pkg.reviewCount > 0 && (
                <a href="#reviews" className="inline-flex items-center gap-1 font-semibold text-ink hover:underline">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="text-sun-500"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6L5.8 21l1.4-7L2 9.3l7-.8L12 2Z" /></svg>
                  <span className="tabular">{pkg.rating.toFixed(1)}</span>
                  <span className="font-normal text-ink-mute">({pkg.reviewCount} reviews)</span>
                </a>
              )}
              <span>{pkg.destinationName}</span>
            </p>
          </div>
          <CompareToggle slug={pkg.slug} />
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
          <div className="min-w-0">
            <Gallery images={detail.gallery} title={pkg.title} />

            {/* In-page section links; sticky under the navbar */}
            <nav aria-label="On this page" className="sticky top-16 z-20 -mx-4 mt-6 border-b border-line bg-cream/95 px-4 backdrop-blur lg:top-[72px] lg:mx-0 lg:px-0">
              <ul className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
                {sections.map(([id, label]) => (
                  <li key={id}><a href={`#${id}`} className="block whitespace-nowrap rounded-pill px-3.5 py-2 text-sm font-semibold text-ink-soft hover:bg-cream-deep hover:text-ink">{label}</a></li>
                ))}
              </ul>
            </nav>

            <Section id="overview" title="Overview">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[["Duration", formatDuration(pkg.nights, pkg.days)], ["Destination", pkg.destinationName], ["Good for", pkg.themes.slice(0, 2).map((t) => t[0].toUpperCase() + t.slice(1)).join(", ")], ["Group size", `1–${booking.maxTravelers} travelers`]].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-line/70 bg-paper p-3"><dt className="text-xs text-ink-mute">{k}</dt><dd className="mt-0.5 font-semibold text-ink">{v}</dd></div>
                ))}
              </dl>
              <h3 className="mt-6 text-lg">Highlights</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {pkg.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-[15px] text-ink">
                    <Tick className="text-sky-600" />{h}
                  </li>
                ))}
              </ul>
            </Section>

            {/* Mobile and tablet: the booking form sits here, after the overview */}
            <div className="mt-8 lg:hidden">
              <BookingBox anchor slug={pkg.slug} price={pkg.price} listPrice={pkg.listPrice} nights={pkg.nights} days={pkg.days} />
            </div>

            <Section id="itinerary" title="Day-by-day itinerary">
              <Itinerary days={detail.itinerary} />
            </Section>

            <Section id="inclusions" title="What's included">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-line/70 bg-paper p-5">
                  <h3 className="mb-3 text-base text-leaf-600">Included</h3>
                  <ul className="space-y-2 text-[15px]">{pkg.inclusions.map((i) => <li key={i} className="flex gap-2.5"><Tick className="text-leaf-600" />{inclusionLabel[i]}</li>)}</ul>
                </div>
                <div className="rounded-lg border border-line/70 bg-paper p-5">
                  <h3 className="mb-3 text-base text-ink-soft">Not included</h3>
                  <ul className="space-y-2 text-[15px] text-ink-soft">{detail.exclusions.map((e) => <li key={e} className="flex gap-2.5"><Cross />{e}</li>)}</ul>
                </div>
              </div>
            </Section>

            <Section id="stays" title="Where you'll stay">
              <ul className="grid gap-3 sm:grid-cols-2">
                {detail.stays.map((s) => (
                  <li key={s.place} className="flex items-center gap-3 rounded-lg border border-line/70 bg-paper p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-md bg-sky-50 text-sky-700" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20V8l9-4 9 4v12M9 20v-5h6v5M8 11h.01M12 11h.01M16 11h.01" /></svg>
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{s.hotel}</p>
                      <p className="text-sm text-ink-mute">{s.category} · {s.nights} {s.nights === 1 ? "night" : "nights"}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-ink-mute">Exact hotels are confirmed on your booking voucher. We swap only for one of equal or higher category.</p>
            </Section>

            <Section id="policy" title="Cancellation and refunds">
              <div className="overflow-hidden rounded-lg border border-line/70 bg-paper">
                <table className="w-full text-[15px]">
                  <caption className="sr-only">Refund by days before departure</caption>
                  <thead className="bg-cream-deep text-left text-xs font-bold uppercase tracking-[0.08em] text-ink-soft"><tr><th scope="col" className="p-3">When you cancel</th><th scope="col" className="p-3">Refund</th></tr></thead>
                  <tbody className="divide-y divide-line/70">
                    {booking.cancellation.map((c) => (
                      <tr key={c.label}><td className="p-3">{c.label}</td><td className={`p-3 font-semibold ${c.refund === 1 ? "text-leaf-600" : c.refund === 0 ? "text-coral-700" : "text-ink"}`}>{c.outcome}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className="mt-6 text-lg">Good to know</h3>
              <ul className="mt-3 space-y-2 text-[15px] text-ink-soft">{detail.goodToKnow.map((g) => <li key={g} className="flex gap-2.5"><span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-mute" />{g}</li>)}</ul>
            </Section>

            <Section id="reviews" title={reviews.length ? `Reviews (${pkg.reviewCount})` : "Reviews"}>
              {reviews.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line bg-paper p-6 text-center text-ink-soft">No reviews yet. Travelers can review after their trip.</p>
              ) : (
                <ul className="space-y-3">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-lg border border-line/70 bg-paper p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex" role="img" aria-label={`${r.rating} out of 5 stars`}>
                          {Array.from({ length: 5 }).map((_, n) => (
                            <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={n < r.rating ? "text-sun-500" : "text-line"}><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6L5.8 21l1.4-7L2 9.3l7-.8L12 2Z" /></svg>
                          ))}
                        </span>
                        <span className="font-semibold text-ink">{r.name}</span>
                        {r.verified && <VerifiedBadge />}
                        <span className="text-sm text-ink-mute">{r.city}</span>
                      </div>
                      <p className="mt-2 text-[15px] leading-relaxed text-ink">{r.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          {/* Desktop: booking box stays in view */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <BookingBox slug={pkg.slug} price={pkg.price} listPrice={pkg.listPrice} nights={pkg.nights} days={pkg.days} />
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-soft">
                <Tick className="text-leaf-600" /> Secure payment via Razorpay
              </p>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section aria-labelledby="similar-heading" className="mt-12 sm:mt-16">
            <h2 id="similar-heading" className="mb-4 text-2xl sm:mb-6 sm:text-3xl">You might also like</h2>
            <Rail label="Similar packages" from="sm" gridClassName="sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((p) => <li key={p.id}><PackageCard p={p} /></li>)}
            </Rail>
          </section>
        )}
      </div>

      <MobileBookBar price={pkg.price} />
    </>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32 pt-10">
      <h2 id={`${id}-h`} className="mb-4 text-2xl sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

function Tick({ className }: { className?: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`mt-0.5 shrink-0 ${className ?? ""}`}><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function Cross() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-ink-mute"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>;
}
