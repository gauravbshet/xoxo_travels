"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/admin";
import { TAGS } from "@/lib/cache-tags";
import { allowedImageHosts } from "@/config/media";
import { INCLUSIONS, MEALS, THEMES } from "@/config/catalog";
import { Prisma } from "@/generated/prisma/client";
import type { Inclusion, Theme } from "@/lib/types";

const line = (max: number, what: string) => z.string().trim().min(1, `${what} can't be empty.`).max(max, `${what} is too long (max ${max} characters).`);

const daySchema = z.object({
  title: line(100, "Day title"),
  body: line(1000, "Day description"),
  meals: z.array(z.enum(MEALS)).max(3),
  stay: z.string().trim().max(60, "Stay is too long."),
});

const packageSchema = z.object({
  id: z.string().optional(),
  title: line(120, "Title"),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can use lowercase letters, numbers and single hyphens.").max(80),
  destinationId: z.string().min(1, "Pick a destination."),
  nights: z.number().int().min(1, "At least 1 night.").max(30, "At most 30 nights."),
  price: z.number().int().min(1, "Enter a price.").max(10_000_000),
  listPrice: z.number().int().max(10_000_000).nullable(),
  imageSrc: z.url("Enter a full image URL.").refine((u) => {
    try { const h = new URL(u); return h.protocol === "https:" && (allowedImageHosts as readonly string[]).includes(h.hostname); } catch { return false; }
  }, `Image must be an https URL from ${allowedImageHosts.join(", ")}.`),
  imageAlt: line(160, "Image description"),
  highlights: z.array(line(80, "Highlight")).min(1, "Add at least one highlight.").max(6, "Use at most 6 highlights."),
  inclusions: z.array(z.enum(INCLUSIONS as [Inclusion, ...Inclusion[]])),
  themes: z.array(z.enum(THEMES as [Theme, ...Theme[]])).min(1, "Pick at least one theme."),
  bestseller: z.boolean(),
  featured: z.boolean(),
  active: z.boolean(),
  days: z.array(daySchema).max(31, "At most 31 days."),
  exclusions: z.array(line(120, "Exclusion")).max(12),
  goodToKnow: z.array(line(200, "Note")).max(10),
}).refine((p) => p.listPrice === null || p.listPrice > p.price, { message: "List price must be higher than the price, or empty.", path: ["listPrice"] });

export type PackageInput = z.input<typeof packageSchema>;
export type SaveResult = { ok: true; id: string; slug: string } | { ok: false; message: string };

export async function savePackage(input: unknown): Promise<SaveResult> {
  await assertAdmin();
  if (!db) return { ok: false, message: "No database connected." };
  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  const p = parsed.data;

  const clash = await db.package.findFirst({ where: { slug: p.slug, ...(p.id && { id: { not: p.id } }) }, select: { id: true } });
  if (clash) return { ok: false, message: "Another package already uses that slug." };
  if (!(await db.destination.findUnique({ where: { id: p.destinationId }, select: { id: true } }))) return { ok: false, message: "That destination no longer exists." };

  // Stored in the PackageDetail shape the package page merges over its defaults.
  // Empty lists are left out so the generated defaults still apply.
  const itinerary = {
    ...(p.days.length && { itinerary: p.days.map((d, i) => ({ day: i + 1, title: d.title, body: d.body, ...(d.meals.length && { meals: d.meals }), ...(d.stay && { stay: d.stay }) })) }),
    ...(p.exclusions.length && { exclusions: p.exclusions }),
    ...(p.goodToKnow.length && { goodToKnow: p.goodToKnow }),
  };
  const data = {
    title: p.title, slug: p.slug, destinationId: p.destinationId, nights: p.nights, price: p.price, listPrice: p.listPrice,
    imageSrc: p.imageSrc, imageAlt: p.imageAlt, highlights: p.highlights, inclusions: p.inclusions, themes: p.themes,
    bestseller: p.bestseller, featured: p.featured, active: p.active,
    itinerary: Object.keys(itinerary).length ? itinerary : undefined,
  };

  const row = p.id
    ? await db.package.update({ where: { id: p.id }, data: { ...data, itinerary: data.itinerary ?? Prisma.DbNull }, select: { id: true, slug: true } })
    : await db.package.create({ data, select: { id: true, slug: true } });
  updateTag(TAGS.packages);
  return { ok: true, id: row.id, slug: row.slug };
}

export async function setPackageActive(id: unknown, active: unknown): Promise<{ ok: boolean; message?: string }> {
  await assertAdmin();
  const parsed = z.object({ id: z.string().min(1), active: z.boolean() }).safeParse({ id, active });
  if (!parsed.success || !db) return { ok: false, message: "Invalid request." };
  await db.package.update({ where: { id: parsed.data.id }, data: { active: parsed.data.active } });
  updateTag(TAGS.packages);
  return { ok: true };
}

/** Hard delete, only when nothing references the package. Otherwise deactivate it. */
export async function deletePackage(id: unknown): Promise<{ ok: boolean; message?: string }> {
  await assertAdmin();
  const parsed = z.string().min(1).safeParse(id);
  if (!parsed.success || !db) return { ok: false, message: "Invalid request." };
  const [bookings, reviews] = await Promise.all([
    db.booking.count({ where: { packageId: parsed.data } }),
    db.review.count({ where: { packageId: parsed.data } }),
  ]);
  if (bookings || reviews) return { ok: false, message: `This package has ${bookings} bookings and ${reviews} reviews, so it can't be deleted. Deactivate it instead.` };
  await db.package.delete({ where: { id: parsed.data } });
  updateTag(TAGS.packages);
  return { ok: true };
}
