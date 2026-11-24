/** Cache tags for "use cache" data. Admin actions expire these after a write. */
export const TAGS = {
  /** Packages, package details and destination pages (they count packages and prices). */
  packages: "packages",
  /** Group trips, their seat counts and detail pages. */
  groupTrips: "group-trips",
  /** Offers shown on the homepage and offers page. */
  offers: "offers",
  /** Approved reviews and testimonials. */
  reviews: "reviews",
} as const;
