/* Find a Partner and chat rules. Change here, not in components. */

const num = (v: string | undefined, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };

export const partners = {
  /** Match radius around the searcher's location, in km. */
  radiusKm: num(process.env.PARTNER_MATCH_RADIUS_KM, 200),
  /** Coordinates are rounded to this many decimals before saving (2 ≈ 1 km). */
  coordDecimals: 2,
  maxActiveTrips: 3,
  noteMax: 300,
  requestMessageMax: 300,
  maxMatches: 50,
  reportReasons: [
    { value: "harassment", label: "Harassment or abuse" },
    { value: "fake", label: "Fake profile" },
    { value: "spam", label: "Spam or scam" },
    { value: "unsafe", label: "Made me feel unsafe" },
    { value: "other", label: "Something else" },
  ],
} as const;

export const chat = {
  messageMax: 2000,
  pageSize: 50,
  /** Signed links to chat photos last this long (seconds). */
  imageUrlTtl: 60 * 60,
  /** Live-update tokens last this long (seconds). The client reconnects after. */
  tokenTtl: 60 * 60,
} as const;

/** Per-user limits, counted over a rolling window. Upstash replaces the counting in phase 6. */
export const limits = {
  requestsPerDay: 10,
  messagesPerMinute: 20,
  reportsPerDay: 5,
} as const;

export type ReportReason = (typeof partners.reportReasons)[number]["value"];
