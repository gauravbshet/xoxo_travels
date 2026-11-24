/* Booking rules. Change here, not in components. Confirm GST with your CA. */
export const booking = {
  currency: "INR",
  /** GST on tour packages, added on top of the listed price. */
  gstRate: 0.05,
  gstLabel: "GST (5%)",
  /** Full payment at booking. Deposit support can be added later. */
  paymentMode: "full" as "full" | "deposit",
  maxTravelers: 12,
  /** Earliest bookable departure, in days from today. */
  minLeadDays: 3,
  /** Group trips: "Only N left" shows at or below this many seats. */
  lowSeatsThreshold: 4,
  /** A pending booking holds group-trip seats for this long, then they free up. */
  seatHoldMinutes: 15,
  /** Flat coupons for these offer scopes take the amount off per seat, not per booking. */
  perSeatCoupons: ["group-trips"],
  /** Youngest allowed lead traveler (the person who pays and is contacted). */
  leadMinAge: 18,
  /** Refund slabs by days before departure, checked top to bottom. */
  cancellation: [
    { minDays: 30, refund: 1, label: "30 days or more before departure", outcome: "Full refund" },
    { minDays: 15, refund: 0.5, label: "15–29 days before departure", outcome: "50% refund" },
    { minDays: 0, refund: 0, label: "14 days or less before departure", outcome: "No refund" },
  ],
} as const;

/** Price breakdown in whole rupees. */
export function priceFor(perPerson: number, travelers: number, discount = 0) {
  const subtotal = perPerson * travelers;
  const taxable = Math.max(0, subtotal - discount);
  const gst = Math.round(taxable * booking.gstRate);
  return { subtotal, discount, gst, total: taxable + gst };
}

/** Refund share (0–1) for cancelling `daysBefore` days before departure, from the slabs above. */
export function refundShare(daysBefore: number) {
  const slab = booking.cancellation.find((c) => daysBefore >= c.minDays) ?? booking.cancellation[booking.cancellation.length - 1];
  return { share: slab.refund as number, label: slab.outcome as string };
}

/** Optional extras offered at checkout. `field` is the Booking column set once payment is confirmed. */
export const extraServices = [
  { key: "visa", field: "visaAssistance", label: "Visa assistance", question: "Do you require visa application assistance?" },
  { key: "esim", field: "esimRequired", label: "eSIM", question: "Do you need an eSIM for your trip?" },
  { key: "flights", field: "flightAssistance", label: "Flight assistance", question: "Do you require assistance with flight bookings?" },
] as const;

export type ExtraServiceKey = (typeof extraServices)[number]["key"];
export type ExtraServices = Record<ExtraServiceKey, boolean>;
