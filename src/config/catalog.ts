import type { Inclusion, Theme } from "@/lib/types";

/** Options the admin package form offers. Keep in step with the Inclusion / Theme types. */
export const INCLUSIONS: Inclusion[] = ["flights", "hotel", "meals", "transfers", "sightseeing", "visa"];
export const THEMES: Theme[] = ["honeymoon", "family", "adventure", "beach", "luxury", "budget", "weekend", "culture"];
export const MEALS = ["Breakfast", "Lunch", "Dinner"] as const;
