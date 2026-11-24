/* Prisma row → domain model. Keeps components independent of the DB shape. */
import type { Destination, GroupTrip, Inclusion, Package, Theme, TripStyle } from "@/lib/types";
import type { Offer } from "./offers";
import type { Review } from "./reviews";
import type {
  Destination as DbDestination, Package as DbPackage, GroupTrip as DbGroupTrip,
  Offer as DbOffer, Review as DbReview, Profile as DbProfile,
} from "@/generated/prisma/client";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function toDestination(d: DbDestination & { packages?: { price: number }[] }): Destination {
  const prices = d.packages?.map((p) => p.price) ?? [];
  return {
    id: d.id, slug: d.slug, name: d.name, area: d.area, region: d.region, tagline: d.tagline,
    image: { src: d.imageSrc, alt: d.imageAlt },
    fromPrice: prices.length ? Math.min(...prices) : null,
    packageCount: prices.length,
    bestMonths: d.bestMonths, tags: d.tags, featured: d.featured,
  };
}

export function toPackage(p: DbPackage & { destination: Pick<DbDestination, "slug" | "name" | "region">; reviews?: { rating: number }[] }): Package {
  const r = p.reviews ?? [];
  return {
    id: p.id, slug: p.slug, title: p.title,
    destinationSlug: p.destination.slug, destinationName: p.destination.name, region: p.destination.region,
    nights: p.nights, days: p.nights + 1, price: p.price, listPrice: p.listPrice,
    rating: r.length ? Math.round((r.reduce((a, b) => a + b.rating, 0) / r.length) * 10) / 10 : 0,
    reviewCount: r.length,
    image: { src: p.imageSrc, alt: p.imageAlt },
    highlights: p.highlights, inclusions: p.inclusions as Inclusion[], themes: p.themes as Theme[],
    bestseller: p.bestseller, featured: p.featured,
  };
}

export function toGroupTrip(t: DbGroupTrip & { destination: Pick<DbDestination, "slug" | "name" | "region">; _count?: { bookings: number }; seatsBooked?: number }): GroupTrip {
  const booked = t.seatsBooked ?? 0;
  const style = t.style.replace("_", "-") as TripStyle;
  return {
    id: t.id, slug: t.slug, title: t.title,
    destinationSlug: t.destination.slug, destinationName: t.destination.name, region: t.destination.region,
    style, startDate: iso(t.startDate), endDate: iso(t.endDate),
    nights: Math.round((t.endDate.getTime() - t.startDate.getTime()) / 86_400_000), days: Math.round((t.endDate.getTime() - t.startDate.getTime()) / 86_400_000) + 1,
    price: t.price, seatsTotal: t.seatsTotal, seatsLeft: Math.max(0, t.seatsTotal - booked),
    image: { src: t.imageSrc, alt: t.imageAlt }, leader: t.leader, featured: t.featured,
  };
}

export function toOffer(o: DbOffer): Offer {
  return {
    id: o.id, code: o.code, title: o.title, blurb: o.blurb, kind: o.kind, value: o.value,
    minSpend: o.minSpend, maxDiscount: o.maxDiscount, validTill: iso(o.validTill),
    appliesTo: o.appliesTo as Offer["appliesTo"], tone: o.tone as Offer["tone"],
  };
}

export function toReview(r: DbReview & { user: { profile: Pick<DbProfile, "displayName" | "city" | "verified"> | null }; package: Pick<DbPackage, "slug" | "title">; booking: { travelDate: Date | null } }): Review {
  return {
    id: r.id,
    name: r.user.profile?.displayName ?? "Traveler",
    city: r.user.profile?.city ?? "",
    rating: Math.min(5, Math.max(1, r.rating)) as Review["rating"],
    trip: r.package.title, tripHref: `/holidays/${r.package.slug}`,
    text: r.text,
    travelled: iso(r.booking.travelDate ?? r.createdAt).slice(0, 7),
    verified: r.user.profile?.verified ?? false,
  };
}
