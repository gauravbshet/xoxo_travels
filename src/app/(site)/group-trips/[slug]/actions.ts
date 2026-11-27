"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getGroupTripBySlug } from "@/lib/data/group-trips";
import { booking } from "@/config/booking";
import { clientIp, limit } from "@/lib/rate-limit";

export type WaitlistState = { status: "idle" | "ok" | "error"; message: string };

const schema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().trim().min(2, "Enter your name.").max(80, "Name is too long."),
  email: z.email("Enter a valid email address.").max(160),
  travelers: z.coerce.number().int().min(1).max(booking.maxTravelers),
});

/* Joins the waitlist for a sold-out trip. One entry per email per trip, so
   submitting twice updates it. Anyone can join; no sign-in needed. */
export async function joinWaitlist(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  { const l = await limit("waitlist", await clientIp()); if (l) return { status: "error", message: l }; }
  const { slug, name, email, travelers } = parsed.data;

  const trip = await getGroupTripBySlug(slug);
  if (!trip) return { status: "error", message: "This trip is no longer open." };

  const cleanEmail = email.toLowerCase();
  if (!db) {
    // No database: log in dev, fail loudly in production. Never pretend to save.
    if (process.env.NODE_ENV === "production") throw new Error("Waitlist needs DATABASE_URL in production.");
    console.info(`[waitlist:dev] ${cleanEmail} joined "${slug}" for ${travelers}`);
    return { status: "ok", message: "You are on the waitlist (dev mode, not saved)." };
  }

  const row = await db.groupTrip.findUnique({ where: { slug }, select: { id: true } });
  if (!row) return { status: "error", message: "This trip is no longer open." };
  await db.waitlist.upsert({
    where: { groupTripId_email: { groupTripId: row.id, email: cleanEmail } },
    create: { groupTripId: row.id, email: cleanEmail, name, travelers },
    update: { name, travelers },
  });
  return { status: "ok", message: "You are on the waitlist. We email you if a seat opens." };
}
