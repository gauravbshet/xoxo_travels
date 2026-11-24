"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/admin";
import { TAGS } from "@/lib/cache-tags";
import { imageUrlSchema, line, slugSchema } from "@/lib/admin-schemas";

const schema = z.object({
  id: z.string().optional(),
  name: line(60, "Name"),
  slug: slugSchema,
  area: line(60, "Area"),
  region: z.enum(["domestic", "international"]),
  tagline: line(120, "Tagline"),
  imageSrc: imageUrlSchema,
  imageAlt: line(160, "Image description"),
  bestMonths: z.string().trim().max(40),
  tags: z.array(z.string().trim().min(1).max(24)).max(8, "Use at most 8 tags."),
  featured: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export type DestinationInput = z.input<typeof schema>;
type Result = { ok: true; id: string } | { ok: false; message: string };

function refresh() { updateTag(TAGS.packages); updateTag(TAGS.groupTrips); }

export async function saveDestination(input: unknown): Promise<Result> {
  await assertAdmin();
  if (!db) return { ok: false, message: "No database connected." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  const { id, ...d } = parsed.data;
  const clash = await db.destination.findFirst({ where: { slug: d.slug, ...(id && { id: { not: id } }) }, select: { id: true } });
  if (clash) return { ok: false, message: "Another destination already uses that slug." };
  const data = { ...d, tags: d.tags.map((t) => t.toLowerCase()) };
  const row = id ? await db.destination.update({ where: { id }, data, select: { id: true } }) : await db.destination.create({ data, select: { id: true } });
  refresh();
  return { ok: true, id: row.id };
}

export async function deleteDestination(id: unknown): Promise<{ ok: boolean; message?: string }> {
  await assertAdmin();
  if (typeof id !== "string" || !db) return { ok: false, message: "Invalid request." };
  const [p, g, t] = await Promise.all([
    db.package.count({ where: { destinationId: id } }),
    db.groupTrip.count({ where: { destinationId: id } }),
    db.partnerTrip.count({ where: { destinationId: id } }),
  ]);
  if (p || g || t) return { ok: false, message: `In use by ${p} packages, ${g} group trips and ${t} partner trips. Move or delete those first.` };
  await db.destination.delete({ where: { id } });
  refresh();
  return { ok: true };
}
