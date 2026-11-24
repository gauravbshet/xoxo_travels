"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/admin";

/** Marks a report handled. Optionally hides the reported traveler from Find a Partner. */
export async function resolveReport(input: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = await assertAdmin();
  const parsed = z.object({ id: z.string().min(1), hideUser: z.boolean() }).safeParse(input);
  if (!parsed.success || !db) return { ok: false, message: "Invalid request." };
  const r = await db.report.findUnique({ where: { id: parsed.data.id }, select: { reportedId: true, resolved: true } });
  if (!r) return { ok: false, message: "That report no longer exists." };
  if (r.resolved) return { ok: false, message: "Already resolved." };
  await db.$transaction([
    db.report.update({ where: { id: parsed.data.id }, data: { resolved: true, resolvedBy: admin.email } }),
    ...(parsed.data.hideUser ? [db.profile.updateMany({ where: { userId: r.reportedId }, data: { discoverable: false } })] : []),
  ]);
  return { ok: true };
}
