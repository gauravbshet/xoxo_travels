"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/admin";
import { TAGS } from "@/lib/cache-tags";
import { isoDate, line } from "@/lib/admin-schemas";

const schema = z.object({
  id: z.string().optional(),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,32}$/, "Code: 3–32 letters or numbers, no spaces."),
  title: line(80, "Title"),
  blurb: line(140, "Blurb"),
  kind: z.enum(["percent", "flat"]),
  value: z.number().int().min(1, "Enter a value."),
  minSpend: z.number().int().min(1).nullable(),
  maxDiscount: z.number().int().min(1).nullable(),
  validFrom: isoDate("a start date"),
  validTill: isoDate("an end date"),
  appliesTo: z.enum(["all", "domestic", "international", "group-trips", "honeymoon"]),
  tone: z.enum(["coral", "blue", "green", "yellow"]),
  active: z.boolean(),
  usageLimit: z.number().int().min(1).nullable(),
})
  .refine((o) => o.kind !== "percent" || o.value <= 90, { message: "A percent discount can be at most 90%.", path: ["value"] })
  .refine((o) => o.validTill >= o.validFrom, { message: "The end date must be on or after the start date.", path: ["validTill"] });

export type OfferInput = z.input<typeof schema>;

export async function saveOffer(input: unknown): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  await assertAdmin();
  if (!db) return { ok: false, message: "No database connected." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  const { id, validFrom, validTill, ...o } = parsed.data;
  const clash = await db.offer.findFirst({ where: { code: o.code, ...(id && { id: { not: id } }) }, select: { id: true } });
  if (clash) return { ok: false, message: "Another offer already uses that code." };
  const data = { ...o, maxDiscount: o.kind === "percent" ? o.maxDiscount : null, validFrom: new Date(validFrom), validTill: new Date(validTill) };
  const row = id ? await db.offer.update({ where: { id }, data, select: { id: true } }) : await db.offer.create({ data, select: { id: true } });
  updateTag(TAGS.offers);
  return { ok: true, id: row.id };
}

export async function deleteOffer(id: unknown): Promise<{ ok: boolean; message?: string }> {
  await assertAdmin();
  if (typeof id !== "string" || !db) return { ok: false, message: "Invalid request." };
  const used = await db.booking.count({ where: { offerId: id } });
  if (used) return { ok: false, message: `Used on ${used} bookings, so it can't be deleted. Turn it off instead.` };
  await db.offer.delete({ where: { id } });
  updateTag(TAGS.offers);
  return { ok: true };
}
