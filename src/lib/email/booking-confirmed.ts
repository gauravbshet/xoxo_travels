import "server-only";
import { db } from "@/lib/db";
import { getBookingById, type BookingView } from "@/lib/data/bookings";
import { booking as rules } from "@/config/booking";
import { formatDate, formatDateRange, formatINR } from "@/lib/format";
import { siteUrl } from "@/lib/site-url";
import { sendEmail } from "./send";
import { reportError } from "@/lib/monitoring/server";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function dates(b: BookingView) {
  if (b.startDate && b.endDate) return formatDateRange(b.startDate, b.endDate);
  return b.startDate ? formatDate(b.startDate) : "";
}

export function bookingConfirmedEmail(b: BookingView) {
  const url = `${siteUrl}/checkout/confirmation?ref=${b.reference}`;
  const rows: [string, string][] = [
    ["Reference", b.reference],
    ["Trip", b.title],
    ["Dates", dates(b)],
    ["Travelers", String(b.travelers)],
    ...(b.leader ? [["Trip leader", b.leader] as [string, string]] : []),
    ["Amount paid", formatINR(b.total)],
  ];
  const subject = `Booking confirmed: ${b.title} (${b.reference})`;
  const text = [
    `Hi ${b.contact.name || "there"},`,
    "",
    "Your booking is confirmed.",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    `Cancellation: ${rules.cancellation.map((c) => `${c.label}: ${c.outcome}`).join("; ")}.`,
    "",
    `View your booking: ${url}`,
    `GST invoice: ${siteUrl}/account/bookings/${b.reference}/invoice`,
    "",
    "XOXO Travels",
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#fffdf8;font-family:Arial,Helvetica,sans-serif;color:#0b1220">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e9e3d7;border-radius:14px">
<tr><td style="padding:28px 28px 8px"><p style="margin:0;font-size:20px;font-weight:800;color:#0a6b52">XOXO.Travels</p>
<h1 style="margin:18px 0 6px;font-size:24px">Your booking is confirmed</h1>
<p style="margin:0;color:#465062">Hi ${esc(b.contact.name || "there")}, you're all set. Keep this email for your records.</p></td></tr>
<tr><td style="padding:16px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">
${rows.map(([k, v]) => `<tr><td style="padding:8px 0;color:#465062;border-bottom:1px solid #f2ede3">${esc(k)}</td><td align="right" style="padding:8px 0;font-weight:700;border-bottom:1px solid #f2ede3">${esc(v)}</td></tr>`).join("")}
</table></td></tr>
<tr><td style="padding:8px 28px 4px"><a href="${esc(url)}" style="display:inline-block;background:#0a6b52;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">View booking</a> <a href="${esc(`${siteUrl}/account/bookings/${b.reference}/invoice`)}" style="display:inline-block;margin-left:8px;color:#0a6b52;font-weight:700;text-decoration:underline">GST invoice</a></td></tr>
<tr><td style="padding:18px 28px 28px;font-size:13px;color:#465062">Cancellation: ${rules.cancellation.map((c) => `${esc(c.label)}: ${esc(c.outcome)}`).join(" · ")}.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

/**
 * Sends the confirmation email once per booking. The confirmationEmailAt column
 * is claimed atomically first, so the checkout handler and the webhook can't
 * both send. If sending fails, the claim is released so a later call can retry.
 * Never throws: the booking is already confirmed, email is best effort (logged loudly).
 */
export async function sendBookingConfirmation(bookingId: string) {
  if (!db) return;
  const claimed = await db.booking.updateMany({ where: { id: bookingId, status: "confirmed", confirmationEmailAt: null }, data: { confirmationEmailAt: new Date() } });
  if (claimed.count === 0) return;
  try {
    const b = await getBookingById(bookingId);
    const to = b?.contact.email;
    if (!b || !to) throw new Error("no contact email on booking");
    await sendEmail({ to, ...bookingConfirmedEmail(b) });
  } catch (e) {
    await db.booking.update({ where: { id: bookingId }, data: { confirmationEmailAt: null } }).catch(() => {});
    await reportError(e, { tags: { area: "email", kind: "booking-confirmation" }, extra: { bookingId } });
  }
}
