"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/admin";

/** Admin switch for a traveler's Find a Partner visibility. */
export async function setDiscoverableAdmin(input: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  await assertAdmin();
  const parsed = z.object({ userId: z.string().min(1), on: z.boolean() }).safeParse(input);
  if (!parsed.success || !db) return { ok: false, message: "Invalid request." };
  const r = await db.profile.updateMany({ where: { userId: parsed.data.userId }, data: { discoverable: parsed.data.on } });
  return r.count ? { ok: true } : { ok: false, message: "This user has no profile yet." };
}
