import { cacheLife, cacheTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { withDatabaseFallback } from "@/lib/db";
import { PACKAGES } from "../../../prisma/seed-data";
import { toPackage } from "./mappers";
import type { Package, Region, Theme } from "@/lib/types";

export type PackageFilters = {
  destination?: string; region?: Region; theme?: Theme;
  budget?: string;      // "min-max" per person, INR
  duration?: "weekend" | "short" | "long";
  sort?: "popular" | "price-asc" | "price-desc" | "rating";
};

const include = { destination: { select: { slug: true, name: true, region: true } }, reviews: { where: { approved: true }, select: { rating: true } } } as const;

export async function getFeaturedPackages(limit = 8): Promise<Package[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.packages);
  return withDatabaseFallback(
    "featured packages",
    async (client) => (await client.package.findMany({ where: { featured: true, active: true }, include, orderBy: [{ bestseller: "desc" }, { createdAt: "desc" }], take: limit })).map(toPackage),
    () => PACKAGES.filter((p) => p.featured).slice(0, limit),
  );
}

export async function getPackagesByDestination(slug: string): Promise<Package[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.packages);
  return withDatabaseFallback(
    "packages by destination",
    async (client) => (await client.package.findMany({ where: { active: true, destination: { slug } }, include, orderBy: { price: "asc" } })).map(toPackage),
    () => PACKAGES.filter((p) => p.destinationSlug === slug),
  );
}

export async function getPackageBySlug(slug: string): Promise<Package | null> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.packages);
  return withDatabaseFallback(
    "package lookup",
    async (client) => {
      const row = await client.package.findFirst({ where: { slug, active: true }, include });
      return row ? toPackage(row) : null;
    },
    () => PACKAGES.find((p) => p.slug === slug) ?? null,
  );
}

export async function getPackagesBySlugs(slugs: string[]): Promise<Package[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.packages);
  return withDatabaseFallback(
    "packages by slug",
    async (client) => {
      const rows = await client.package.findMany({ where: { slug: { in: slugs }, active: true }, include });
      const map = new Map(rows.map((r) => [r.slug, toPackage(r)]));
      return slugs.map((s) => map.get(s)).filter((p): p is Package => !!p);
    },
    () => slugs.map((s) => PACKAGES.find((p) => p.slug === s)).filter((p): p is Package => !!p),
  );
}

/* Filtering runs in memory after a broad fetch: the catalogue is small
   (hundreds, not millions) and the ratings aggregate is derived anyway. */
export async function searchPackages(f: PackageFilters = {}): Promise<Package[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.packages);
  const base = await withDatabaseFallback(
    "package search",
    async (client) => (await client.package.findMany({ where: { active: true, ...(f.region && { destination: { region: f.region } }) }, include })).map(toPackage),
    () => PACKAGES,
  );
  const q = f.destination?.trim().toLowerCase();
  const [min, max] = (f.budget ?? "").split("-").map((s) => (s ? Number(s) : undefined));
  let out = base.filter((p) => {
    if (q && !(p.destinationName.toLowerCase().includes(q) || p.title.toLowerCase().includes(q))) return false;
    if (f.region && p.region !== f.region) return false;
    if (f.theme && !p.themes.includes(f.theme)) return false;
    if (min !== undefined && p.price < min) return false;
    if (max !== undefined && p.price > max) return false;
    if (f.duration === "weekend" && p.nights > 3) return false;
    if (f.duration === "short" && (p.nights < 4 || p.nights > 6)) return false;
    if (f.duration === "long" && p.nights < 7) return false;
    return true;
  });
  switch (f.sort) {
    case "price-asc": out = out.sort((a, b) => a.price - b.price); break;
    case "price-desc": out = out.sort((a, b) => b.price - a.price); break;
    case "rating": out = out.sort((a, b) => b.rating - a.rating); break;
    default: out = out.sort((a, b) => Number(b.bestseller) - Number(a.bestseller) || b.reviewCount - a.reviewCount);
  }
  return out;
}
