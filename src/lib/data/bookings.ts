import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/* A user's bookings. Never cached: status changes the moment a payment lands. */

const include = {
  package: { select: { slug: true, title: true, imageSrc: true, imageAlt: true, nights: true, destination: { select: { name: true } } } },
  groupTrip: { select: { slug: true, title: true, imageSrc: true, imageAlt: true, startDate: true, endDate: true, leader: true, destination: { select: { name: true } } } },
  offer: { select: { code: true } },
  payments: { where: { status: "captured" }, orderBy: { updatedAt: "desc" }, take: 1, select: { updatedAt: true, method: true } },
  review: { select: { id: true, approved: true } },
} satisfies Prisma.BookingInclude;

type Row = Prisma.BookingGetPayload<{ include: typeof include }>;

export type BookingStatusView = "pending" | "confirmed" | "cancelled" | "refunded" | "completed" | "expired";

export type BookingView = {
  id: string;
  reference: string;
  /** Stored status, except an unpaid booking whose start date has passed shows as "expired". */
  status: BookingStatusView;
  kind: "package" | "trip";
  title: string;
  href: string;
  destinationName: string;
  image: { src: string; alt: string };
  startDate: string | null;
  endDate: string | null;
  leader: string | null;
  travelers: number;
  /** Rupees (stored in paise) */
  subtotal: number; discount: number; tax: number; total: number;
  couponCode: string | null;
  createdAt: string;
  paidAt: string | null;
  paymentMethod: string | null;
  contact: { name: string; email: string; phone: string };
  people: { name: string; age: number }[];
  /** Package trip that has ended and has no review yet. */
  reviewable: boolean;
  review: { approved: boolean } | null;
};

const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);
const addDays = (isoDate: string, n: number) => { const d = new Date(isoDate); d.setDate(d.getDate() + n); return iso(d); };

function toView(b: Row, today: string): BookingView {
  const details = (b.travelerDetails ?? {}) as { contact?: Partial<BookingView["contact"]>; travelers?: BookingView["people"] };
  const isTrip = Boolean(b.groupTrip);
  const start = isTrip ? iso(b.groupTrip!.startDate) : iso(b.travelDate);
  const end = isTrip ? iso(b.groupTrip!.endDate) : start && b.package ? addDays(start, b.package.nights) : null;
  const status: BookingStatusView = b.status === "pending" && start && start < today ? "expired" : b.status;
  const item = b.groupTrip ?? b.package;
  return {
    id: b.id, reference: b.reference, status, kind: isTrip ? "trip" : "package",
    title: item?.title ?? "Trip",
    href: isTrip ? `/group-trips/${b.groupTrip!.slug}` : b.package ? `/holidays/${b.package.slug}` : "/",
    destinationName: item?.destination.name ?? "",
    image: { src: item?.imageSrc ?? "", alt: item?.imageAlt ?? "" },
    startDate: start, endDate: end, leader: b.groupTrip?.leader ?? null,
    travelers: b.travelers,
    subtotal: b.subtotal / 100, discount: b.discount / 100, tax: b.tax / 100, total: b.total / 100,
    couponCode: b.offer?.code ?? null,
    createdAt: b.createdAt.toISOString(),
    paidAt: b.payments[0]?.updatedAt.toISOString() ?? null,
    paymentMethod: b.payments[0]?.method ?? null,
    contact: { name: details.contact?.name ?? "", email: details.contact?.email ?? "", phone: details.contact?.phone ?? "" },
    people: details.travelers ?? [],
    reviewable: !isTrip && Boolean(b.package) && (b.status === "confirmed" || b.status === "completed") && Boolean(end && end < today) && !b.review,
    review: b.review ? { approved: b.review.approved } : null,
  };
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export async function getBookingsForUser(userId: string): Promise<BookingView[]> {
  if (!db) return [];
  const rows = await db.booking.findMany({ where: { userId }, include, orderBy: { createdAt: "desc" }, take: 50 });
  const t = todayIso();
  return rows.map((r) => toView(r, t));
}

export async function getBookingForUser(userId: string, reference: string): Promise<BookingView | null> {
  if (!db) return null;
  const row = await db.booking.findUnique({ where: { reference }, include });
  return row && row.userId === userId ? toView(row, todayIso()) : null;
}

export async function getBookingById(id: string): Promise<BookingView | null> {
  if (!db) return null;
  const row = await db.booking.findUnique({ where: { id }, include });
  return row ? toView(row, todayIso()) : null;
}
