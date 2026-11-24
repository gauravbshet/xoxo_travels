const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** ₹48,999 — Indian digit grouping, no paise. */
export const formatINR = (n: number) => inr.format(n);

const dShort = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const dLong = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** "12 Dec – 18 Dec 2026" */
export function formatDateRange(startISO: string, endISO: string) {
  return `${dShort.format(new Date(startISO))} – ${dLong.format(new Date(endISO))}`;
}

/** "5N / 6D" */
export const formatDuration = (nights: number, days: number) => `${nights}N / ${days}D`;

/** "2026-12" → { from, to } month bounds */
export function monthBounds(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return null;
  return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0, 23, 59, 59) };
}

/** "18 Jan 2027" */
export const formatDate = (iso: string) => dLong.format(new Date(iso));
