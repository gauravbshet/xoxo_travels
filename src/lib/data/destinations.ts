import { cacheLife, cacheTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { withDatabaseFallback } from "@/lib/db";
import { DESTINATIONS as SEED, PACKAGES } from "../../../prisma/seed-data";
import { toDestination } from "./mappers";
import type { Destination, Region } from "@/lib/types";

const include = { packages: { where: { active: true }, select: { price: true } } } as const;

/* In-memory mode derives count + "from" price from the packages themselves,
   exactly as the DB path does, so the two modes always agree. */
const DESTINATIONS: Destination[] = SEED.map((d) => {
  const prices = PACKAGES.filter((p) => p.destinationSlug === d.slug).map((p) => p.price);
  return { ...d, packageCount: prices.length, fromPrice: prices.length ? Math.min(...prices) : null };
});

export async function getPopularDestinations(region?: Region, limit = 8): Promise<Destination[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.packages, TAGS.groupTrips);
  return withDatabaseFallback(
    "popular destinations",
    async (client) => (await client.destination.findMany({ where: { featured: true, ...(region && { region }) }, include, orderBy: { sortOrder: "asc" }, take: limit })).map(toDestination),
    () => DESTINATIONS.filter((d) => d.featured && (!region || d.region === region)).slice(0, limit),
  );
}

export async function searchDestinations(opts: { q?: string; region?: Region } = {}): Promise<Destination[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.packages, TAGS.groupTrips);
  const q = opts.q?.trim().toLowerCase();
  return withDatabaseFallback(
    "destination search",
    async (client) => {
      const rows = await client.destination.findMany({
        where: {
          ...(opts.region && { region: opts.region }),
          ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { area: { contains: q, mode: "insensitive" } }, { tagline: { contains: q, mode: "insensitive" } }, { tags: { has: q } }] }),
        },
        include, orderBy: { sortOrder: "asc" },
      });
      return rows.map(toDestination);
    },
    () => DESTINATIONS.filter((d) => {
      if (opts.region && d.region !== opts.region) return false;
      if (!q) return true;
      return [d.name, d.area, d.tagline, ...d.tags].some((s) => s.toLowerCase().includes(q));
    }),
  );
}

export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.packages, TAGS.groupTrips);
  return withDatabaseFallback(
    "destination lookup",
    async (client) => {
      const row = await client.destination.findUnique({ where: { slug }, include });
      return row ? toDestination(row) : null;
    },
    () => DESTINATIONS.find((d) => d.slug === slug) ?? null,
  );
}

export async function getAllDestinationSlugs(): Promise<string[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.packages, TAGS.groupTrips);
  return withDatabaseFallback(
    "destination slugs",
    async (client) => (await client.destination.findMany({ select: { slug: true } })).map((d) => d.slug),
    () => DESTINATIONS.map((d) => d.slug),
  );
}
