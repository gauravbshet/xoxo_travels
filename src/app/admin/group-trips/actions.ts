"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/admin";
import { TAGS } from "@/lib/cache-tags";
import { imageUrlSchema, isoDate, line, slugSchema } from "@/lib/admin-schemas";
import { Prisma } from "@/generated/prisma/client";

const day = z.object({ title: line(100, "Day title"), body: line(1000, "Day description"), meals: z.array(z.enum(["Breakfast", "Lunch", "Dinner"])).max(3), stay: z.string().trim().max(60) });

const schema = z.object({
  id: z.string().optional(),
  title: line(120, "Title"),
  slug: slugSchema,
  destinationId: z.string().min(1, "Pick a destination."),
  style: z.enum(["trek", "backpacking", "roadtrip", "women_only"]),
  startDate: isoDate("a start date"),
  endDate: isoDate("an end date"),
  price: z.number().int().min(1, "Enter a price.").max(10_000_000),
  seatsTotal: z.number().int().min(1, "At least 1 seat.").max(200),
  imageSrc: imageUrlSchema,
  imageAlt: line(160, "Image description"),
  leader: line(60, "Leader name"),
  featured: z.boolean(),
  active: z.boolean(),
  days: z.array(day).max(31),
  inclusions: z.array(line(120, "Inclusion")).max(12),
  exclusions: z.array(line(120, "Exclusion")).max(12),
  goodToKnow: z.array(line(200, "Note")).max(10),
  meetingPoint: z.string().trim().max(200),
  leaderBio: z.string().trim().max(400),
}).refine((t) => t.endDate >= t.startDate, { message: "The end date must be on or after the start date.", path: ["endDate"] });

export type TripInput = z.input<typeof schema>;

export async function saveTrip(input: unknown): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  await assertAdmin();
  if (!db) return { ok: false, message: "No database connected." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  const t = parsed.data;

  const clash = await db.groupTrip.findFirst({ where: { slug: t.slug, ...(t.id && { id: { not: t.id } }) }, select: { id: true } });
  if (clash) return { ok: false, message: "Another trip already uses that slug." };
  if (t.id) {
    // Never shrink below seats already sold.
    const sold = await db.booking.aggregate({ _sum: { travelers: true }, where: { groupTripId: t.id, status: { in: ["confirmed", "completed"] } } });
    const n = sold._sum.travelers ?? 0;
    if (t.seatsTotal < n) return { ok: false, message: `${n} seats are already sold, so total seats can't be lower than that.` };
  }

  // Same JSON shape the trip page merges over its generated defaults. Empty parts are left out.
  const detail = {
    ...(t.days.length && { itinerary: t.days.map((d, i) => ({ day: i + 1, title: d.title, body: d.body, ...(d.meals.length && { meals: d.meals }), ...(d.stay && { stay: d.stay }) })) }),
    ...(t.inclusions.length && { inclusions: t.inclusions }),
    ...(t.exclusions.length && { exclusions: t.exclusions }),
    ...(t.goodToKnow.length && { goodToKnow: t.goodToKnow }),
    ...(t.meetingPoint && { meetingPoint: t.meetingPoint }),
    ...(t.leaderBio && { leaderBio: t.leaderBio }),
  };
  const data = {
    title: t.title, slug: t.slug, destinationId: t.destinationId, style: t.style, startDate: new Date(t.startDate), endDate: new Date(t.endDate),
    price: t.price, seatsTotal: t.seatsTotal, imageSrc: t.imageSrc, imageAlt: t.imageAlt, leader: t.leader, featured: t.featured, active: t.active,
    itinerary: Object.keys(detail).length ? detail : Prisma.DbNull,
  };
  const row = t.id ? await db.groupTrip.update({ where: { id: t.id }, data, select: { id: true } }) : await db.groupTrip.create({ data, select: { id: true } });
  updateTag(TAGS.groupTrips);
  return { ok: true, id: row.id };
}

export async function deleteTrip(id: unknown): Promise<{ ok: boolean; message?: string }> {
  await assertAdmin();
  if (typeof id !== "string" || !db) return { ok: false, message: "Invalid request." };
  const bookings = await db.booking.count({ where: { groupTripId: id } });
  if (bookings) return { ok: false, message: `This trip has ${bookings} bookings, so it can't be deleted. Set it inactive instead.` };
  await db.groupTrip.delete({ where: { id } }); // waitlist rows cascade
  updateTag(TAGS.groupTrips);
  return { ok: true };
}

export async function setTripActive(id: unknown, active: unknown): Promise<{ ok: boolean; message?: string }> {
  await assertAdmin();
  const parsed = z.object({ id: z.string().min(1), active: z.boolean() }).safeParse({ id, active });
  if (!parsed.success || !db) return { ok: false, message: "Invalid request." };
  await db.groupTrip.update({ where: { id: parsed.data.id }, data: { active: parsed.data.active } });
  updateTag(TAGS.groupTrips);
  return { ok: true };
}
