/* Security defaults. Change numbers here, not in code. */

/** Short-window limits, counted in Upstash Redis (in memory during development). */
export const rateRules = {
  /** Every server-action POST, per IP address. Stops scripted floods before any work runs. */
  actionsPerIp: { limit: 120, windowSec: 60 },
  /** Creating a booking (seat holds), per user. */
  checkout: { limit: 10, windowSec: 600 },
  /** Starting or verifying a payment, per user. */
  payment: { limit: 20, windowSec: 600 },
  /** Trying coupon codes, per user. Stops guessing codes. */
  coupon: { limit: 15, windowSec: 600 },
  /** Asking for an upload link (photo, ID, chat image), per user. */
  upload: { limit: 30, windowSec: 3600 },
  /** Saving the profile, per user. */
  profile: { limit: 30, windowSec: 3600 },
  /** ID verification submissions, per user. */
  verification: { limit: 5, windowSec: 86_400 },
  /** Reviews, per user. */
  review: { limit: 5, windowSec: 3600 },
  /** Joining a waitlist, per IP (no sign-in needed). */
  waitlist: { limit: 10, windowSec: 3600 },
  /** Declaring Find a Partner trips, per user. */
  partnerTrip: { limit: 20, windowSec: 3600 },
} as const;

export type RateRule = keyof typeof rateRules;

/**
 * Production needs Upstash so limits hold across all server instances.
 * true: a production server without UPSTASH_* keys refuses limited actions with an error
 * (fails loudly, never silently unprotected). Set false to fall back to per-instance memory.
 */
export const requireUpstashInProduction = true;

/** "enforce" blocks anything outside the policy; "report-only" only logs it in the browser console. */
export const cspMode: "enforce" | "report-only" = process.env.CSP_REPORT_ONLY === "true" ? "report-only" : "enforce";
