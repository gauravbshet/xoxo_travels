import { cacheLife, cacheTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { getActiveOffers, type Offer } from "./offers";
import { searchPackages } from "./packages";
import { getUpcomingGroupTrips } from "./group-trips";
import { booking } from "@/config/booking";
import { formatDateRange, formatINR } from "@/lib/format";
import type { Package } from "@/lib/types";

/* Slides for the rotating home banner, built from live data so every claim on
   it is true: active offers, the biggest package discount, and a group trip
   that is nearly full. Edit offers in admin and the banner follows. */

export type PromoSlide = {
  id: string;
  kind: "offer" | "deal" | "seats";
  tone: "coral" | "blue" | "green" | "yellow";
  eyebrow: string;
  title: string;
  blurb: string;
  /** The big number, e.g. "15%" or "₹2,000" */
  highlight: string;
  highlightSub: string;
  /** ISO date the deal ends, for "Ends in N days" */
  validTill: string | null;
  /** Short urgency line, e.g. "Only 4 seats left" */
  urgency: string | null;
  code: string | null;
  primary: { label: string; href: string };
  secondary: { label: string; href: string } | null;
  image: { src: string; alt: string };
};

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=70`;

/* A fitting photo per offer scope. Unsplash placeholders, like the rest of the seed media. */
const scopeImage: Record<Offer["appliesTo"], { src: string; alt: string }> = {
  all: { src: u("photo-1506905925346-21bda4d32df4"), alt: "Turquoise alpine lake under snowy peaks" },
  international: { src: u("photo-1537996194471-e657df975ab4"), alt: "Rice terraces in Bali" },
  domestic: { src: u("photo-1512343879784-a960bf40e7f2"), alt: "Palm-lined beach in Goa" },
  "group-trips": { src: u("photo-1581791534721-e599df4417f7"), alt: "Mountain road in Ladakh" },
  honeymoon: { src: u("photo-1514282401047-d79a71a590e8"), alt: "Overwater villas in the Maldives" },
};

export const scopeHref: Record<Offer["appliesTo"], string> = {
  all: "/holidays",
  international: "/holidays?region=international",
  domestic: "/holidays?region=domestic",
  "group-trips": "/group-trips",
  honeymoon: "/holidays?theme=honeymoon",
};

const offPct = (p: Package) => (p.listPrice ? Math.round((1 - p.price / p.listPrice) * 100) : 0);

export async function getPromoSlides(): Promise<PromoSlide[]> {
  "use cache"; cacheLife("hours"); cacheTag(TAGS.offers, TAGS.packages, TAGS.groupTrips);
  const [offers, packages, trips] = await Promise.all([getActiveOffers(4), searchPackages(), getUpcomingGroupTrips(12)]);

  const offerSlides: PromoSlide[] = offers.map((o) => ({
    id: `offer-${o.code}`,
    kind: "offer",
    tone: o.tone,
    eyebrow: "Limited-time offer",
    title: o.title,
    blurb: [o.blurb, o.minSpend ? `Min. spend ${formatINR(o.minSpend)}.` : "", o.maxDiscount ? `Save up to ${formatINR(o.maxDiscount)}.` : ""].filter(Boolean).join(" "),
    highlight: o.kind === "percent" ? `${o.value}%` : formatINR(o.value),
    highlightSub: o.appliesTo === "group-trips" && o.kind === "flat" ? "off per seat" : "off",
    validTill: o.validTill,
    urgency: null,
    code: o.code,
    primary: { label: "Grab the offer", href: scopeHref[o.appliesTo] },
    secondary: { label: "Explore deals", href: "/#deals" },
    image: scopeImage[o.appliesTo],
  }));

  const best = [...packages].filter((p) => offPct(p) > 0).sort((a, b) => offPct(b) - offPct(a))[0];
  const dealSlide: PromoSlide[] = best ? [{
    id: `deal-${best.slug}`,
    kind: "deal",
    tone: "coral",
    eyebrow: "Deal of the week",
    title: best.title,
    blurb: `${best.highlights.slice(0, 2).join(" · ")}. Now ${formatINR(best.price)} per person, was ${formatINR(best.listPrice!)}.`,
    highlight: `${offPct(best)}%`,
    highlightSub: "off today",
    validTill: null,
    urgency: best.reviewCount > 50 ? `${best.reviewCount}+ travelers loved it` : null,
    code: null,
    primary: { label: "Book now", href: `/holidays/${best.slug}` },
    secondary: { label: "Explore deals", href: "/#deals" },
    image: best.image,
  }] : [];

  const filling = trips.filter((t) => t.seatsLeft > 0 && t.seatsLeft <= booking.lowSeatsThreshold).sort((a, b) => a.seatsLeft - b.seatsLeft)[0];
  const seatsSlide: PromoSlide[] = filling ? [{
    id: `seats-${filling.slug}`,
    kind: "seats",
    tone: "green",
    eyebrow: "Filling fast",
    title: filling.title,
    blurb: `${formatDateRange(filling.startDate, filling.endDate)} with ${filling.leader}. Small group, fixed date, everything planned.`,
    highlight: String(filling.seatsLeft),
    highlightSub: filling.seatsLeft === 1 ? "seat left" : "seats left",
    validTill: null,
    urgency: `Only ${filling.seatsLeft} ${filling.seatsLeft === 1 ? "seat" : "seats"} left`,
    code: null,
    primary: { label: "Reserve my seat", href: `/group-trips/${filling.slug}` },
    secondary: { label: "All departures", href: "/group-trips" },
    image: filling.image,
  }] : [];

  // Lead with the strongest hook, then alternate kinds so it never feels repetitive.
  return [...dealSlide, ...offerSlides.slice(0, 1), ...seatsSlide, ...offerSlides.slice(1)].slice(0, 6);
}
