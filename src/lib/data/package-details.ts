import { cacheLife, cacheTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { withDatabaseFallback } from "@/lib/db";
import { DESTINATIONS, PACKAGES, REVIEWS } from "../../../prisma/seed-data";
import { getPackageBySlug, searchPackages } from "./packages";
import { toReview } from "./mappers";
import type { Package, PackageDetail, ItineraryDay } from "@/lib/types";
import type { Review } from "./reviews";

/* Hand-written itineraries for the seed catalogue. Packages without one get a
   generated outline from their highlights. In DB mode, Package.itinerary
   (JSON, PackageDetail shape) wins. Admin edits that field in phase 3.6. */
const WRITTEN: Record<string, ItineraryDay[]> = {
  "goa-beach-break": [
    { day: 1, title: "Arrive in Goa", body: "Pickup from Goa airport or Madgaon station and drive to your North Goa hotel. Evening free at Baga or Calangute beach.", meals: ["Dinner"], stay: "Calangute" },
    { day: 2, title: "North Goa forts and beaches", body: "Fort Aguada, Sinquerim and Anjuna by afternoon. Sunset cruise on the Mandovi with live music.", meals: ["Breakfast", "Dinner"], stay: "Calangute" },
    { day: 3, title: "Old Goa and Panjim", body: "Basilica of Bom Jesus and Se Cathedral, then a walk through the Latin Quarter in Fontainhas. Evening free for the markets.", meals: ["Breakfast", "Dinner"], stay: "Calangute" },
    { day: 4, title: "Depart", body: "Breakfast, check out, and drop at the airport or station.", meals: ["Breakfast"] },
  ],
  "bali-bliss": [
    { day: 1, title: "Arrive in Bali", body: "Airport pickup and transfer to Ubud. Welcome dinner at the villa.", meals: ["Dinner"], stay: "Ubud" },
    { day: 2, title: "Ubud rice terraces and temples", body: "Tegallalang terraces, the Sacred Monkey Forest and Tirta Empul water temple.", meals: ["Breakfast"], stay: "Ubud" },
    { day: 3, title: "Kintamani volcano view", body: "Mount Batur viewpoint, coffee plantation tasting, and an afternoon at leisure in your private pool.", meals: ["Breakfast", "Lunch"], stay: "Ubud" },
    { day: 4, title: "Move to Seminyak", body: "Transfer to the coast. Afternoon free on Seminyak beach.", meals: ["Breakfast"], stay: "Seminyak" },
    { day: 5, title: "Uluwatu sunset", body: "Padang Padang beach, Uluwatu temple at sunset and the Kecak fire dance.", meals: ["Breakfast", "Dinner"], stay: "Seminyak" },
    { day: 6, title: "Depart", body: "Breakfast and airport drop.", meals: ["Breakfast"] },
  ],
};

const STAY_CATEGORY: Record<string, string> = { luxury: "5-star", budget: "3-star" };

function generated(p: Package): ItineraryDay[] {
  const days: ItineraryDay[] = [{ day: 1, title: `Arrive in ${p.destinationName}`, body: `Pickup on arrival and transfer to your hotel. The rest of the day is yours to settle in.`, meals: ["Dinner"], stay: p.destinationName }];
  for (let d = 2; d <= p.nights; d++) {
    const h = p.highlights[(d - 2) % p.highlights.length];
    days.push({ day: d, title: h, body: `A guided day built around ${h.toLowerCase()}, with time to explore on your own afterwards.`, meals: ["Breakfast"], stay: p.destinationName });
  }
  days.push({ day: p.days, title: "Depart", body: "Breakfast, check out, and drop at the airport or station.", meals: ["Breakfast"] });
  return days;
}

/** Generated defaults for a package page. The admin editor starts from these when nothing is saved yet. */
export function buildDetail(p: Package): PackageDetail {
  const dest = DESTINATIONS.find((d) => d.slug === p.destinationSlug);
  const siblings = PACKAGES.filter((x) => x.region === p.region && x.slug !== p.slug).slice(0, 3);
  const all = ["flights", "hotel", "meals", "transfers", "sightseeing", "visa"] as const;
  const label: Record<string, string> = { flights: "Flights", hotel: "Hotel stays", meals: "Meals beyond those listed", transfers: "Airport transfers", sightseeing: "Sightseeing and entry tickets", visa: "Visa fees" };
  const itinerary = WRITTEN[p.slug] ?? generated(p);
  const stayPlaces = [...new Set(itinerary.map((d) => d.stay).filter(Boolean))] as string[];
  return {
    itinerary,
    exclusions: [
      ...all.filter((i) => !p.inclusions.includes(i) && (i !== "visa" || p.region === "international")).map((i) => label[i]),
      "Personal expenses, tips and laundry",
      "Travel insurance (can be added at checkout)",
    ],
    stays: stayPlaces.map((place) => ({
      place,
      hotel: p.themes.includes("luxury") ? `Premium resort, ${place}` : `Handpicked hotel, ${place}`,
      nights: itinerary.filter((d) => d.stay === place).length,
      category: p.themes.map((t) => STAY_CATEGORY[t]).find(Boolean) ?? "4-star",
    })),
    gallery: [p.image, ...(dest ? [dest.image] : []), ...siblings.map((s) => s.image)].filter((img, i, arr) => arr.findIndex((x) => x.src === img.src) === i).slice(0, 5),
    goodToKnow: [
      "Hotel check-in is usually 2 pm and check-out 11 am.",
      p.region === "international" ? "Passport must be valid for 6 months from your return date." : "Carry a government photo ID for hotel check-in.",
      "Itinerary order can shift for weather or local events; nothing is dropped.",
    ],
  };
}

export async function getPackageDetail(slug: string): Promise<{ pkg: Package; detail: PackageDetail } | null> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.packages, TAGS.reviews);
  const pkg = await getPackageBySlug(slug);
  if (!pkg) return null;
  let detail = buildDetail(pkg);
  const itinerary = await withDatabaseFallback(
    "package itinerary",
    async (client) => (await client.package.findUnique({ where: { slug }, select: { itinerary: true } }))?.itinerary ?? null,
    () => null,
  );
  if (itinerary && typeof itinerary === "object") detail = { ...detail, ...(itinerary as Partial<PackageDetail>) };
  return { pkg, detail };
}

export async function getPackageReviews(slug: string, limit = 6): Promise<Review[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.packages, TAGS.reviews);
  return withDatabaseFallback(
    "package reviews",
    async (client) => (await client.review.findMany({
      where: { approved: true, package: { slug } },
      include: { user: { select: { profile: { select: { displayName: true, city: true, verified: true } } } }, package: { select: { slug: true, title: true } }, booking: { select: { travelDate: true } } },
      orderBy: { createdAt: "desc" }, take: limit,
    })).map(toReview),
    () => REVIEWS.filter((r) => r.tripHref === `/holidays/${slug}`).slice(0, limit),
  );
}

export async function getSimilarPackages(p: Package, limit = 4): Promise<Package[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.packages, TAGS.reviews);
  const all = await searchPackages();
  return all
    .filter((x) => x.slug !== p.slug)
    .map((x) => ({ x, score: (x.destinationSlug === p.destinationSlug ? 3 : 0) + x.themes.filter((t) => p.themes.includes(t)).length + (x.region === p.region ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.x);
}

export async function getAllPackageSlugs(): Promise<string[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.packages, TAGS.reviews);
  return withDatabaseFallback(
    "package slugs",
    async (client) => (await client.package.findMany({ where: { active: true }, select: { slug: true } })).map((p) => p.slug),
    () => PACKAGES.map((p) => p.slug),
  );
}
