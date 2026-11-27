"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getBookingForUser } from "@/lib/data/bookings";
import { limit } from "@/lib/rate-limit";

/** A traveler reviews a package trip they completed. Held until an admin approves it. */
export async function submitReview(input: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!db) return { ok: false, message: "No database connected." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in first." };
  { const l = await limit("review", user.id); if (l) return { ok: false, message: l }; }
  const parsed = z.object({
    reference: z.string().regex(/^XO-[A-Z0-9]+$/),
    rating: z.number().int().min(1, "Pick a star rating.").max(5),
    text: z.string().trim().min(20, "Write at least 20 characters so others learn something.").max(1000, "Keep it under 1000 characters."),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your review." };

  const b = await getBookingForUser(user.id, parsed.data.reference);
  if (!b || !b.reviewable) return { ok: false, message: "You can review a holiday after it ends." };
  const row = await db.booking.findUnique({ where: { id: b.id }, select: { packageId: true } });
  if (!row?.packageId) return { ok: false, message: "Only holiday packages can be reviewed for now." };

  await db.review.create({ data: { userId: user.id, packageId: row.packageId, bookingId: b.id, rating: parsed.data.rating, text: parsed.data.text } });
  return { ok: true };
}
