import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, Skeleton } from "@/components/ui";
import { PrintButton } from "@/components/bookings/print-button";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getBookingById } from "@/lib/data/bookings";
import { ensureInvoiceNumber, rupeesInWords } from "@/lib/invoice";
import { invoice as cfg } from "@/config/invoice";
import { booking as rules } from "@/config/booking";
import { formatDate, formatDateRange } from "@/lib/format";

export const metadata: Metadata = { title: "Tax invoice", robots: { index: false } };

/* Exact rupees with paise for a tax document. */
const money = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InvoicePage({ params }: PageProps<"/account/bookings/[reference]/invoice">) {
  return (
    <div className="container-x mx-auto max-w-3xl py-8 print:max-w-none print:p-0">
      <Suspense fallback={<Skeleton className="h-[40rem] rounded-xl" />}><Invoice params={params} /></Suspense>
    </div>
  );
}

async function Invoice({ params }: { params: PageProps<"/account/bookings/[reference]/invoice">["params"] }) {
  const [{ reference }, user] = await Promise.all([params, getCurrentUser()]);
  if (!user || !db) return <EmptyState title="Sign in to see invoices" blurb="Invoices are available from My bookings." action={{ label: "My bookings", href: "/account/bookings" }} />;

  const row = await db.booking.findUnique({
    where: { reference },
    select: { id: true, userId: true, subtotal: true, discount: true, tax: true, total: true, status: true, travelers: true,
      payments: { where: { status: { in: ["captured", "refunded"] } }, orderBy: { updatedAt: "desc" }, take: 1, select: { razorpayPaymentId: true, method: true, updatedAt: true } } },
  });
  // Owners and admins only; a 404-style message otherwise (don't reveal the booking exists).
  if (!row || (row.userId !== user.id && user.role !== "admin")) {
    return <EmptyState title="Invoice not found" blurb="Check the link, or open the booking from My bookings." action={{ label: "My bookings", href: "/account/bookings" }} />;
  }
  const number = await ensureInvoiceNumber(row.id);
  if (!number) return <EmptyState title="No invoice yet" blurb="A tax invoice is issued once the booking is paid." action={{ label: "My bookings", href: "/account/bookings" }} />;

  const b = (await getBookingById(row.id))!;
  const inv = await db.booking.findUnique({ where: { id: row.id }, select: { invoiceDate: true } });
  const taxable = row.subtotal - row.discount;
  const half = Math.floor(row.tax / 2);
  const ratePct = Math.round(rules.gstRate * 100 * 100) / 100;
  const pay = row.payments[0];
  const dates = b.startDate && b.endDate ? formatDateRange(b.startDate, b.endDate) : b.startDate ? formatDate(b.startDate) : "";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/account/bookings" className="text-sm font-semibold text-sky-700 hover:underline">← My bookings</Link>
        <PrintButton />
      </div>

      <article className="rounded-xl border border-line bg-paper p-6 text-[13px] leading-relaxed text-ink shadow-card sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-2xl font-extrabold text-sky-600">{cfg.sellerName}</p>
            <p className="mt-1 text-ink-soft">{cfg.sellerAddress}</p>
            <p className="text-ink-soft">GSTIN: <span className="font-semibold text-ink">{cfg.gstin || "Applied for"}</span> · State: {cfg.sellerState} ({cfg.sellerStateCode})</p>
          </div>
          <div className="sm:text-right">
            <h1 className="font-display text-xl font-extrabold uppercase tracking-[0.12em]">Tax invoice</h1>
            <dl className="mt-1 space-y-0.5">
              <div><dt className="inline text-ink-mute">Invoice no. </dt><dd className="inline font-mono font-semibold">{number}</dd></div>
              <div><dt className="inline text-ink-mute">Invoice date </dt><dd className="inline font-semibold">{formatDate((inv?.invoiceDate ?? new Date()).toISOString())}</dd></div>
              <div><dt className="inline text-ink-mute">Booking ref. </dt><dd className="inline font-mono font-semibold">{b.reference}</dd></div>
            </dl>
          </div>
        </header>

        <section className="grid gap-4 border-b border-line py-5 sm:grid-cols-2">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-mute">Billed to</h2>
            <p className="mt-1 font-semibold">{b.contact.name || "Traveler"}</p>
            {b.contact.email && <p className="text-ink-soft">{b.contact.email}</p>}
            {b.contact.phone && <p className="text-ink-soft">{b.contact.phone}</p>}
          </div>
          <div className="sm:text-right">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-mute">Place of supply</h2>
            <p className="mt-1 font-semibold">{cfg.sellerState} ({cfg.sellerStateCode})</p>
            {pay && <p className="text-ink-soft">Paid {formatDate(pay.updatedAt.toISOString())}{pay.method && pay.method !== "mock" ? ` · ${pay.method}` : ""}</p>}
            {pay?.razorpayPaymentId && <p className="font-mono text-xs text-ink-soft">{pay.razorpayPaymentId}</p>}
          </div>
        </section>

        <div className="overflow-x-auto py-5">
          <table className="w-full min-w-[32rem] text-left">
            <thead className="border-b border-line text-[11px] uppercase tracking-[0.08em] text-ink-mute">
              <tr><th className="py-2 pr-3">Description</th><th className="py-2 pr-3">SAC</th><th className="py-2 pr-3 text-right">Qty</th><th className="py-2 pr-3 text-right">Rate</th><th className="py-2 text-right">Amount</th></tr>
            </thead>
            <tbody>
              <tr className="border-b border-line align-top">
                <td className="py-3 pr-3">
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-ink-soft">{b.kind === "trip" ? "Group trip" : "Holiday package"} · {b.destinationName}{dates ? ` · ${dates}` : ""}</p>
                </td>
                <td className="py-3 pr-3 font-mono">{cfg.sac}</td>
                <td className="py-3 pr-3 text-right tabular">{row.travelers}</td>
                <td className="py-3 pr-3 text-right tabular">{money(row.subtotal / row.travelers)}</td>
                <td className="py-3 text-right tabular">{money(row.subtotal)}</td>
              </tr>
            </tbody>
          </table>

          <dl className="ml-auto mt-4 max-w-xs space-y-1.5">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tabular">{money(row.subtotal)}</dd></div>
            {row.discount > 0 && <div className="flex justify-between"><dt className="text-ink-soft">Discount{b.couponCode ? ` (${b.couponCode})` : ""}</dt><dd className="tabular">−{money(row.discount)}</dd></div>}
            <div className="flex justify-between font-semibold"><dt>Taxable value</dt><dd className="tabular">{money(taxable)}</dd></div>
            {cfg.supply === "intra" ? (
              <>
                <div className="flex justify-between"><dt className="text-ink-soft">CGST @ {ratePct / 2}%</dt><dd className="tabular">{money(half)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-soft">SGST @ {ratePct / 2}%</dt><dd className="tabular">{money(row.tax - half)}</dd></div>
              </>
            ) : (
              <div className="flex justify-between"><dt className="text-ink-soft">IGST @ {ratePct}%</dt><dd className="tabular">{money(row.tax)}</dd></div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd className="tabular">{money(row.total)}</dd></div>
          </dl>
          <p className="mt-3 text-right text-xs text-ink-soft">{rupeesInWords(row.total / 100)}</p>
        </div>

        <footer className="space-y-1 border-t border-line pt-4 text-xs text-ink-mute">
          {(row.status === "refunded" || row.status === "cancelled") && <p className="font-semibold text-coral-700">This booking was later {row.status}. Any refund is adjusted separately.</p>}
          <p>Travelers: {b.people.map((p) => p.name).join(", ") || row.travelers}.</p>
          <p>This is a computer-generated invoice and does not need a signature.</p>
          <p>{cfg.sellerName} · {cfg.sellerAddress}</p>
        </footer>
      </article>
    </>
  );
}
