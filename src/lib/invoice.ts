import "server-only";
import { db } from "@/lib/db";
import { financialYear, invoice as cfg } from "@/config/invoice";

/**
 * Gives a paid booking its GST invoice number, once. Numbers are consecutive
 * within a financial year: the counter row is incremented inside the same
 * transaction that stores the number, so two payments can't get the same one.
 * Safe to call repeatedly; returns the existing number if there is one.
 */
export async function ensureInvoiceNumber(bookingId: string): Promise<string | null> {
  if (!db) return null;
  return db.$transaction(async (tx) => {
    const b = await tx.booking.findUnique({ where: { id: bookingId }, select: { invoiceNumber: true, status: true, payments: { where: { status: { in: ["captured", "refunded"] } }, select: { id: true }, take: 1 } } });
    if (!b) return null;
    if (b.invoiceNumber) return b.invoiceNumber;
    if (b.payments.length === 0) return null; // never paid: no tax invoice
    const now = new Date();
    const fy = financialYear(now);
    const counter = await tx.invoiceCounter.upsert({ where: { fy }, create: { fy, last: 1 }, update: { last: { increment: 1 } } });
    const number = `${cfg.prefix}/${fy}/${String(counter.last).padStart(5, "0")}`;
    await tx.booking.update({ where: { id: bookingId }, data: { invoiceNumber: number, invoiceDate: now } });
    return number;
  });
}

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function twoDigits(n: number) { return n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`; }
function threeDigits(n: number) { const h = Math.floor(n / 100), r = n % 100; return [h ? `${ones[h]} Hundred` : "", r ? twoDigits(r) : ""].filter(Boolean).join(" "); }

/** Rupees in words with Indian grouping: "Rupees One Lakh Twenty Thousand Five Hundred Only". */
export function rupeesInWords(amount: number) {
  let n = Math.round(amount);
  if (n === 0) return "Rupees Zero Only";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n) parts.push(threeDigits(n));
  return `Rupees ${parts.join(" ")} Only`;
}
