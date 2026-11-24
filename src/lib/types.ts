/* Domain models. Mirrors the Prisma schema that replaces the mock data. */

export type Region = "domestic" | "international";

export type Destination = {
  id: string;
  slug: string;
  name: string;
  /** State for India, country otherwise */
  area: string;
  region: Region;
  tagline: string;
  image: { src: string; alt: string };
  /** Lowest package price per person, in INR. Null if no packages yet. */
  fromPrice: number | null;
  packageCount: number;
  bestMonths: string;
  tags: string[];
  featured: boolean;
};

export type Inclusion = "flights" | "hotel" | "meals" | "transfers" | "sightseeing" | "visa";
export type Theme = "honeymoon" | "family" | "adventure" | "beach" | "luxury" | "budget" | "weekend" | "culture";

export type Package = {
  id: string;
  slug: string;
  title: string;
  destinationSlug: string;
  destinationName: string;
  region: Region;
  nights: number;
  days: number;
  /** Per person, INR */
  price: number;
  /** Strike-through price when discounted */
  listPrice: number | null;
  rating: number;
  reviewCount: number;
  image: { src: string; alt: string };
  highlights: string[];
  inclusions: Inclusion[];
  themes: Theme[];
  bestseller: boolean;
  featured: boolean;
};

export type TripStyle = "trek" | "backpacking" | "roadtrip" | "women-only";

export type GroupTrip = {
  id: string;
  slug: string;
  title: string;
  destinationSlug: string;
  destinationName: string;
  region: Region;
  style: TripStyle;
  /** ISO dates */
  startDate: string;
  endDate: string;
  nights: number;
  days: number;
  price: number;
  seatsTotal: number;
  seatsLeft: number;
  image: { src: string; alt: string };
  leader: string;
  featured: boolean;
};

export type ItineraryDay = { day: number; title: string; body: string; meals?: string[]; stay?: string };

export type PackageDetail = {
  itinerary: ItineraryDay[];
  exclusions: string[];
  stays: { place: string; hotel: string; nights: number; category: string }[];
  gallery: { src: string; alt: string }[];
  goodToKnow: string[];
};

/** Extra content for a group trip's detail page. */
export type GroupTripDetail = {
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  meetingPoint: string;
  leaderBio: string;
  goodToKnow: string[];
};
