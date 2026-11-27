import { cacheLife, cacheTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { withDatabaseFallback } from "@/lib/db";
import { REVIEWS } from "../../../prisma/seed-data";
import { toReview } from "./mappers";

export type Review = {
  id: string;
  name: string;
  city: string;
  rating: 1 | 2 | 3 | 4 | 5;
  trip: string;
  tripHref: string;
  text: string;
  /** ISO month */
  travelled: string;
  verified: boolean;
};

export type TrustStat = { label: string; value: number; suffix?: string; decimals?: number };

export async function getFeaturedReviews(limit = 6): Promise<Review[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.reviews);
  return withDatabaseFallback(
    "featured reviews",
    async (client) => (await client.review.findMany({
      where: { approved: true, featured: true },
      include: { user: { select: { profile: { select: { displayName: true, city: true, verified: true } } } }, package: { select: { slug: true, title: true } }, booking: { select: { travelDate: true } } },
      orderBy: { createdAt: "desc" }, take: limit,
    })).map(toReview),
    () => REVIEWS.slice(0, limit),
  );
}

export async function getTrustStats(): Promise<TrustStat[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.reviews);
  return withDatabaseFallback(
    "trust statistics",
    async (client) => {
      const [travelers, destinations, rating, trips] = await Promise.all([
        client.booking.aggregate({ _sum: { travelers: true }, where: { status: { in: ["confirmed", "completed"] } } }),
        client.destination.count(),
        client.review.aggregate({ _avg: { rating: true }, where: { approved: true } }),
        client.groupTrip.count({ where: { endDate: { lt: new Date() } } }),
      ]);
      return [
        { label: "Happy travelers", value: travelers._sum.travelers ?? 0, suffix: "+" },
        { label: "Destinations covered", value: destinations, suffix: "+" },
        { label: "Average rating", value: Math.round((rating._avg.rating ?? 5) * 10) / 10, decimals: 1, suffix: " / 5" },
        { label: "Group trips run", value: trips, suffix: "+" },
      ];
    },
    () => [
      { label: "Travelers since 2019", value: 48000, suffix: "+" },
      { label: "Destinations covered", value: 120, suffix: "+" },
      { label: "Average rating", value: 4.8, decimals: 1, suffix: " / 5" },
      { label: "Group trips run", value: 650, suffix: "+" },
    ],
  );
}

/** Every approved review, newest first (the public reviews page). */
export async function getApprovedReviews(limit = 60): Promise<Review[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.reviews);
  return withDatabaseFallback(
    "approved reviews",
    async (client) => (await client.review.findMany({
      where: { approved: true },
      include: { user: { select: { profile: { select: { displayName: true, city: true, verified: true } } } }, package: { select: { slug: true, title: true } }, booking: { select: { travelDate: true } } },
      orderBy: { createdAt: "desc" }, take: limit,
    })).map(toReview),
    () => REVIEWS.slice(0, limit),
  );
}
