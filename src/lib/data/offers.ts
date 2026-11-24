import { cacheLife, cacheTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { withDatabaseFallback } from "@/lib/db";
import { OFFERS } from "../../../prisma/seed-data";
import { toOffer } from "./mappers";

export type Offer = {
  id: string;
  code: string;
  title: string;
  blurb: string;
  /** "percent" takes `value`% off; "flat" takes ₹`value` off */
  kind: "percent" | "flat";
  value: number;
  minSpend: number | null;
  maxDiscount: number | null;
  /** ISO date, inclusive */
  validTill: string;
  appliesTo: "all" | "domestic" | "international" | "group-trips" | "honeymoon";
  tone: "coral" | "blue" | "green" | "yellow";
};

export async function getActiveOffers(limit = 4): Promise<Offer[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.offers);
  const today = new Date().toISOString().slice(0, 10);
  return withDatabaseFallback(
    "active offers",
    async (client) => (await client.offer.findMany({ where: { active: true, validTill: { gte: new Date(today) }, validFrom: { lte: new Date() } }, orderBy: { validTill: "asc" }, take: limit })).map(toOffer),
    () => OFFERS.filter((o) => o.validTill >= today).slice(0, limit),
  );
}

export const appliesToLabel: Record<Offer["appliesTo"], string> = {
  all: "All bookings", domestic: "India holidays", international: "International holidays", "group-trips": "Group trips", honeymoon: "Honeymoon packages",
};
