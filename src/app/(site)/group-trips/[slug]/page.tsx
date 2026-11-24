import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, Photo } from "@/components/ui";
import { Itinerary } from "@/components/packages/itinerary";
import { GroupBookingBox, GroupMobileBar } from "@/components/group-trips/booking-box";
import { getAllGroupTripSlugs, getGroupTripDetail, tripStyleLabel } from "@/lib/data/group-trips";
import { booking } from "@/config/booking";
import { formatDateRange, formatDuration, formatINR } from "@/lib/format";
import { pageMeta } from "@/lib/metadata";
import { siteUrl } from "@/lib/site-url";

export async function generateStaticParams() {
  return (await getAllGroupTripSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/group-trips/[slug]">) {
  const res = await getGroupTripDetail((await params).slug);
  if (!res) return { title: "Group trip" };
  const { trip } = res;
  return pageMeta({
    title: `${trip.title} · ${formatDateRange(trip.startDate, trip.endDate)}`,
    description: `${tripStyleLabel[trip.style]} in ${trip.destinationName} with ${trip.leader}. From ${formatINR(trip.price)} per person.`,
    path: `/group-trips/${trip.slug}`,
    image: false,
  });
}

const sections = [
  ["overview", "Overview"], ["itinerary", "Itinerary"], ["inclusions", "What's included"], ["leader", "Your leader"], ["policy", "Cancellation"],
] as const;

export default async function GroupTripPage({ params }: PageProps<"/group-trips/[slug]">) {
  const { slug } = await params;
  const res = await getGroupTripDetail(slug);
  if (!res) notFound();
  const { trip, detail, bookingClosed } = res;
  const soldOut = trip.seatsLeft === 0;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: trip.title,
      description: detail.itinerary.map((d) => d.title).join(". "),
      image: trip.image.src,
      itinerary: { "@type": "ItemList", itemListElement: detail.itinerary.map((d) => ({ "@type": "ListItem", position: d.day, name: d.title })) },
      offers: {
        "@type": "Offer", price: trip.price, priceCurrency: "INR",
        availability: soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        url: `${siteUrl}/group-trips/${trip.slug}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Group trips", item: `${siteUrl}/group-trips` },
        { "@type": "ListItem", position: 2, name: trip.title, item: `${siteUrl}/group-trips/${trip.slug}` },
      ],
    },
  ];

  const boxProps = { slug: trip.slug, price: trip.price, seatsLeft: trip.seatsLeft, seatsTotal: trip.seatsTotal, closed: bookingClosed };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="container-x pb-28 pt-6 sm:pt-8 lg:pb-16">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-mute">
          <Link href="/group-trips" className="inline-block py-2 hover:text-ink">Group trips</Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/destinations/${trip.destinationSlug}`} className="inline-block py-2 hover:text-ink">{trip.destinationName}</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-ink-soft">{trip.title}</span>
        </nav>

        <header className="mb-6">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge tone="blue">{tripStyleLabel[trip.style]}</Badge>
            <Badge>{formatDuration(trip.nights, trip.days)}</Badge>
            {soldOut && <Badge tone="neutral">Sold out</Badge>}
          </div>
          <h1 className="text-3xl sm:text-5xl">{trip.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">{formatDateRange(trip.startDate, trip.endDate)} · with {trip.leader}</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
          <div className="min-w-0">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-cream-deep sm:aspect-[16/9]">
              <Photo src={trip.image.src} alt={trip.image.alt} fill priority sizes="(min-width: 1024px) 720px, 100vw" className="object-cover" />
            </div>

            <nav aria-label="On this page" className="sticky top-16 z-20 -mx-4 mt-6 border-b border-line bg-cream/95 px-4 backdrop-blur lg:top-[72px] lg:mx-0 lg:px-0">
              <ul className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
                {sections.map(([id, label]) => (
                  <li key={id}><a href={`#${id}`} className="block whitespace-nowrap rounded-pill px-3.5 py-2 text-sm font-semibold text-ink-soft hover:bg-cream-deep hover:text-ink">{label}</a></li>
                ))}
              </ul>
            </nav>

            <Section id="overview" title="Overview">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Departs", formatDateRange(trip.startDate, trip.endDate)],
                  ["Duration", formatDuration(trip.nights, trip.days)],
                  ["Group size", `Up to ${trip.seatsTotal} travelers`],
                  ["Leader", trip.leader],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-line/70 bg-paper p-3"><dt className="text-xs text-ink-mute">{k}</dt><dd className="mt-0.5 font-semibold text-ink">{v}</dd></div>
                ))}
              </dl>
              <h3 className="mt-6 text-lg">Meeting point</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{detail.meetingPoint}</p>
            </Section>

            {/* Mobile and tablet: the booking box sits here, after the overview */}
            <div className="mt-8 lg:hidden"><GroupBookingBox anchor {...boxProps} /></div>

            <Section id="itinerary" title="Day-by-day itinerary">
              <Itinerary days={detail.itinerary} />
            </Section>

            <Section id="inclusions" title="What's included">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-line/70 bg-paper p-5">
                  <h3 className="mb-3 text-base text-leaf-600">Included</h3>
                  <ul className="space-y-2 text-[15px]">{detail.inclusions.map((i) => <li key={i} className="flex gap-2.5"><Tick className="text-leaf-600" />{i}</li>)}</ul>
                </div>
                <div className="rounded-lg border border-line/70 bg-paper p-5">
                  <h3 className="mb-3 text-base text-ink-soft">Not included</h3>
                  <ul className="space-y-2 text-[15px] text-ink-soft">{detail.exclusions.map((e) => <li key={e} className="flex gap-2.5"><Cross />{e}</li>)}</ul>
                </div>
              </div>
            </Section>

            <Section id="leader" title="Your leader">
              <div className="flex items-start gap-4 rounded-lg border border-line/70 bg-paper p-5">
                <span className="grid size-14 shrink-0 place-items-center rounded-pill bg-sky-600 font-display text-xl font-bold text-white" aria-hidden="true">{trip.leader.slice(0, 1).toUpperCase()}</span>
                <div>
                  <p className="font-display text-lg font-bold text-ink">{trip.leader}</p>
                  <p className="mt-1 text-[15px] text-ink-soft">{detail.leaderBio}</p>
                </div>
              </div>
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
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <GroupBookingBox {...boxProps} />
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-soft"><Tick className="text-leaf-600" /> Secure payment via Razorpay</p>
            </div>
          </aside>
        </div>
      </div>

      <GroupMobileBar price={trip.price} soldOut={soldOut} closed={bookingClosed} />
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
