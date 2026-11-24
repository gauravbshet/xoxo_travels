"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/admin";
import { removeObject } from "@/lib/storage";

/** Approve or reject an ID. The document is deleted from storage either way. */
export async function reviewVerification(input: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = await assertAdmin();
  const parsed = z.object({
    id: z.string().min(1),
    decision: z.enum(["approved", "rejected"]),
    note: z.string().trim().max(300, "Keep the note under 300 characters.").optional(),
  }).safeParse(input);
  if (!parsed.success || !db) return { ok: false, message: parsed.success ? "No database." : parsed.error.issues[0]?.message ?? "Invalid request." };
  const { id, decision, note } = parsed.data;
  if (decision === "rejected" && !note) return { ok: false, message: "Add a short reason so the traveler knows what to fix." };

  const v = await db.verification.findUnique({ where: { id }, select: { userId: true, status: true, documentKey: true } });
  if (!v) return { ok: false, message: "That submission no longer exists." };
  if (v.status !== "pending") return { ok: false, message: "This submission was already reviewed." };

  const now = new Date();
  await db.$transaction([
    db.verification.update({ where: { id }, data: { status: decision, note: note || null, reviewedBy: admin.email, reviewedAt: now, documentKey: "" } }),
    ...(decision === "approved" ? [db.profile.update({ where: { userId: v.userId }, data: { verified: true, verifiedAt: now } })] : []),
  ]);

  // Privacy: the ID file is not kept after review.
  if (v.documentKey) await removeObject("private", v.documentKey).catch((e) => console.error(`[storage] ID file for verification ${id} NOT deleted:`, e));
  return { ok: true };
}
