import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Button, EmptyState, PageHeader, Photo } from "@/components/ui";
import { formatDuration, formatINR } from "@/lib/format";
import { getPackagesBySlugs } from "@/lib/data/packages";
import type { Inclusion } from "@/lib/types";

export const metadata: Metadata = { title: "Compare packages" };

const INCLUSIONS: Inclusion[] = ["flights", "hotel", "meals", "transfers", "sightseeing", "visa"];

export default function ComparePage({ searchParams }: PageProps<"/holidays/compare">) {
  return (
    <div className="container-x py-10 sm:py-14">
      <PageHeader eyebrow="Compare" title="Side by side" blurb="Price, length, rating and what's included, in one table." />
      <Suspense fallback={<div className="skeleton h-96 rounded-lg" aria-busy="true" />}>
        <Table searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Table({ searchParams }: { searchParams: PageProps<"/holidays/compare">["searchParams"] }) {
  const sp = await searchParams;
  const slugs = (typeof sp.p === "string" ? sp.p : "").split(",").filter(Boolean).slice(0, 3);
  const pk = await getPackagesBySlugs(slugs);

  return (
    <>
      {pk.length < 2 ? (
        <EmptyState title="Pick at least two packages" blurb="Tap “Compare” on any package card, then come back here." action={{ label: "Browse packages", href: "/holidays" }} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line/70 bg-paper shadow-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="align-top">
                <th scope="col" className="w-40 p-4 text-left text-xs font-bold uppercase tracking-[0.1em] text-ink-mute">Package</th>
                {pk.map((p) => (
                  <th key={p.id} scope="col" className="p-4 text-left font-normal">
                    <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-md bg-cream-deep"><Photo src={p.image.src} alt={p.image.alt} fill sizes="300px" className="object-cover" /></div>
                    <Link href={`/holidays/${p.slug}`} className="font-display text-lg font-bold leading-snug text-ink hover:text-sky-600">{p.title}</Link>
                    <p className="mt-1 text-ink-mute">{p.destinationName}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70 border-t border-line/70">
              <Row label="Price / person">{pk.map((p) => <td key={p.id} className="tabular p-4 text-lg font-bold">{formatINR(p.price)}</td>)}</Row>
              <Row label="Length">{pk.map((p) => <td key={p.id} className="p-4">{formatDuration(p.nights, p.days)}</td>)}</Row>
              <Row label="Rating">{pk.map((p) => <td key={p.id} className="tabular p-4">{p.rating.toFixed(1)} / 5 <span className="text-ink-mute">({p.reviewCount} reviews)</span></td>)}</Row>
              {INCLUSIONS.map((inc) => (
                <Row key={inc} label={inc[0].toUpperCase() + inc.slice(1)}>
                  {pk.map((p) => (
                    <td key={p.id} className="p-4">
                      {p.inclusions.includes(inc) ? <span className="font-semibold text-leaf-600">Included</span> : <span className="text-ink-mute">—</span>}
                    </td>
                  ))}
                </Row>
              ))}
              <Row label="Highlights">{pk.map((p) => <td key={p.id} className="p-4"><ul className="space-y-1 text-ink-soft">{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul></td>)}</Row>
              <Row label="">{pk.map((p) => <td key={p.id} className="p-4"><Button href={`/holidays/${p.slug}`} size="sm">View package</Button></td>)}</Row>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <tr><th scope="row" className="p-4 text-left align-top text-xs font-bold uppercase tracking-[0.1em] text-ink-mute">{label}</th>{children}</tr>;
}
