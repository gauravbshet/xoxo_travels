import { cacheLife } from "next/cache";
import { getDestinationBySlug } from "./destinations";

export type CommunityPhoto = { id: string; src: string; alt: string; place: string; handle: string; href: string };

/* Curated grid: traveler-tagged photos. Later this reads approved posts
   from the admin panel (or the Instagram Graph API for a business account). */
export async function getCommunityPhotos(): Promise<CommunityPhoto[]> {
  "use cache"; cacheLife("hours");
  const picks: [string, string][] = [
    ["ladakh", "@wanderwithvik"], ["bali", "@ananya.travels"], ["kerala", "@priyanka.r"],
    ["maldives", "@rohan.meera"], ["thailand", "@farhan.goes"], ["kashmir", "@sneha.k"],
  ];
  const out: CommunityPhoto[] = [];
  for (const [slug, handle] of picks) {
    const d = await getDestinationBySlug(slug);
    if (d) out.push({ id: `c-${slug}`, src: d.image.src, alt: d.image.alt, place: d.name, handle, href: `/destinations/${slug}` });
  }
  return out;
}

export type PartnerPreview = { name: string; city: string; destination: string; dates: string; distanceKm: number; verified: boolean; interests: string[] };

/* Illustrative profiles for the promo. Real matches come from the partner API. */
export const partnerPreviews: PartnerPreview[] = [
  { name: "Aditi", city: "Udupi", destination: "Thailand", dates: "12 – 18 Dec", distanceKm: 58, verified: true, interests: ["Beaches", "Street food"] },
  { name: "Karthik", city: "Mangaluru", destination: "Thailand", dates: "10 – 17 Dec", distanceKm: 4, verified: true, interests: ["Scuba", "Nightlife"] },
  { name: "Nisha", city: "Manipal", destination: "Thailand", dates: "14 – 20 Dec", distanceKm: 62, verified: false, interests: ["Temples", "Markets"] },
];
