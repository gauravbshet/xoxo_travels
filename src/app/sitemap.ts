import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";
import { getAllDestinationSlugs } from "@/lib/data/destinations";
import { getAllPackageSlugs } from "@/lib/data/package-details";
import { getAllGroupTripSlugs } from "@/lib/data/group-trips";

/* Only routes that render real content. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics: { path: string; priority: number; freq: "daily" | "weekly" | "monthly" }[] = [
    { path: "", priority: 1, freq: "daily" },
    { path: "/holidays", priority: 0.9, freq: "daily" },
    { path: "/group-trips", priority: 0.9, freq: "daily" },
    { path: "/destinations", priority: 0.8, freq: "weekly" },
    { path: "/offers", priority: 0.6, freq: "weekly" },
    { path: "/visa", priority: 0.5, freq: "monthly" },
    { path: "/support", priority: 0.4, freq: "monthly" },
    { path: "/about", priority: 0.4, freq: "monthly" },
  ];
  const [slugs, pkgs, trips] = await Promise.all([getAllDestinationSlugs(), getAllPackageSlugs(), getAllGroupTripSlugs()]);
  return [
    ...statics.map((s) => ({ url: `${siteUrl}${s.path}`, changeFrequency: s.freq, priority: s.priority })),
    ...slugs.map((slug) => ({ url: `${siteUrl}/destinations/${slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...pkgs.map((slug) => ({ url: `${siteUrl}/holidays/${slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...trips.map((slug) => ({ url: `${siteUrl}/group-trips/${slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
