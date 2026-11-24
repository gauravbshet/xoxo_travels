"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/admin";
import { TAGS } from "@/lib/cache-tags";

/** Approve, hide or feature a review. Approved reviews count toward package ratings. */
export async function moderateReview(input: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  await assertAdmin();
  const parsed = z.object({ id: z.string().min(1), approved: z.boolean(), featured: z.boolean() }).safeParse(input);
  if (!parsed.success || !db) return { ok: false, message: "Invalid request." };
  const { id, approved, featured } = parsed.data;
  const r = await db.review.updateMany({ where: { id }, data: { approved, featured: approved && featured } });
  if (r.count === 0) return { ok: false, message: "That review no longer exists." };
  updateTag(TAGS.reviews);
  updateTag(TAGS.packages); // ratings and review counts on package cards
  return { ok: true };
}
