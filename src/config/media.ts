/* Placeholder photography (Unsplash, free licence). Swap for licensed /
   original images before launch — keep the same shape. */
export const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80",
    alt: "Turquoise alpine lake under snow-capped peaks at sunrise",
    place: "Kashmir, India",
  },
] as const;

export const popularDestinations = [
  "Goa", "Kerala", "Ladakh", "Kashmir", "Rajasthan", "Andaman",
  "Bali", "Thailand", "Dubai", "Maldives", "Singapore", "Vietnam", "Europe",
] as const;

/** Image hosts allowed for pasted image URLs (must match images.remotePatterns in next.config.ts).
    R2 uploads replace pasted URLs in phase 4. */
export const allowedImageHosts = ["images.unsplash.com"] as const;
