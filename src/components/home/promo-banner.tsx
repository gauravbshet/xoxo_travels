import { getPromoSlides } from "@/lib/data/promos";
import { PromoCarousel } from "./promo-carousel";

/** Rotating offers and deals, right under the hero. Slides come from live data (see lib/data/promos.ts). */
export async function PromoBanner() {
  const slides = await getPromoSlides();
  return <PromoCarousel slides={slides} />;
}
