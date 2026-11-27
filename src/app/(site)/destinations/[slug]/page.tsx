import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Photo } from "@/components/ui";
import { PackageCard } from "@/components/packages/package-card";
import { GroupTripCard } from "@/components/group-trips/group-trip-card";
import { getAllDestinationSlugs, getDestinationBySlug } from "@/lib/data/destinations";
import { getPackagesByDestination } from "@/lib/data/packages";
import { searchGroupTrips } from "@/lib/data/group-trips";
import { pageMeta } from "@/lib/metadata";
import { formatINR } from "@/lib/format";
import { siteUrl } from "@/lib/site-url";

/* Prerender every destination; unknown slugs still render on demand. */
export async function generateStaticParams() {
  return (await getAllDestinationSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const d = await getDestinationBySlug((await params).slug);
  if (!d) return { title: "Destination" };
  return pageMeta({
    title: `${d.name} tour packages`,
    description: `${d.tagline}. ${d.packageCount} packages${d.fromPrice ? ` from ${formatINR(d.fromPrice)} per person` : ""}. Best time to visit: ${d.bestMonths}.`,
    path: `/destinations/${d.slug}`,
    image: false, // uses ./opengraph-image.tsx
  });
}

export default async function DestinationPage({ params }: PageProps<"/destinations/[slug]">) {
  const { slug } = await params;
  const d = await getDestinationBySlug(slug);
  if (!d) notFound();
  const [packages, trips] = await Promise.all([getPackagesByDestination(slug), searchGroupTrips({ destination: d.name })]);

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Destinations", item: `${siteUrl}/destinations` },
      { "@type": "ListItem", position: 2, name: d.name, item: `${siteUrl}/destinations/${d.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }} />
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 overflow-hidden bg-ink">
          <Photo src={d.image.src} alt="" fill priority sizes="100vw" className="object-cover opacity-80" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(11_18_32/0.85),rgb(11_18_32/0.3)_60%,rgb(11_18_32/0.2))]" />
        </div>
        <div className="container-x pb-10 pt-24 text-white sm:pb-14 sm:pt-32">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-white/70">
            <Link href="/destinations" className="inline-block py-2 hover:text-white">Destinations</Link> <span aria-hidden="true">/</span> {d.name}
          </nav>
          <Badge tone={d.region === "domestic" ? "blue" : "green"} className="bg-paper/90">{d.area}</Badge>
          <h1 className="mt-3 text-5xl sm:text-6xl">{d.name}</h1>
          <p className="mt-3 max-w-lg text-lg text-white/85">{d.tagline}</p>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div><dt className="text-white/60">Best time</dt><dd className="font-semibold">{d.bestMonths}</dd></div>
            <div><dt className="text-white/60">Packages</dt><dd className="font-semibold">{packages.length}</dd></div>
            <div><dt className="text-white/60">Good for</dt><dd className="font-semibold capitalize">{d.tags.join(" · ")}</dd></div>
          </dl>
        </div>
      </section>

      <section className="container-x py-12 sm:py-16" aria-labelledby="pk-heading">
        <div className="mb-7 flex items-end justify-between gap-4">
          <h2 id="pk-heading" className="text-3xl sm:text-4xl">Packages in {d.name}</h2>
          <Button href={`/holidays?destination=${encodeURIComponent(d.name)}`} variant="outline" size="sm">Filter &amp; sort</Button>
        </div>
        {packages.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line bg-paper p-8 text-center text-ink-soft">Packages for {d.name} are being added. Ask us for a custom plan.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {packages.map((p, i) => <li key={p.id}><PackageCard p={p} priority={i < 4} layout="list" /></li>)}
          </ul>
        )}
      </section>

      {trips.length > 0 && (
        <section className="container-x pb-12 sm:pb-16" aria-labelledby="gt-heading">
          <h2 id="gt-heading" className="mb-7 text-3xl sm:text-4xl">Group departures to {d.name}</h2>
          <ul className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trips.map((t) => <li key={t.id}><GroupTripCard t={t} /></li>)}
          </ul>
        </section>
      )}
    </>
  );
}
