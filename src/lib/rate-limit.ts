import "server-only";
import { db } from "@/lib/db";
import { limits } from "@/config/partners";

/* Rate limits counted from rows already in Postgres. No extra service; good enough
   for launch traffic. Phase 6 swaps the counting for Upstash behind this same API. */

type Kind = "request" | "message" | "report";

export async function overLimit(kind: Kind, userId: string): Promise<string | null> {
  if (!db) return null;
  const now = Date.now();
  if (kind === "request") {
    const n = await db.partnerRequest.count({ where: { fromId: userId, createdAt: { gt: new Date(now - 86_400_000) } } });
    return n >= limits.requestsPerDay ? `You can send ${limits.requestsPerDay} requests a day. Try again tomorrow.` : null;
  }
  if (kind === "message") {
    const n = await db.message.count({ where: { senderId: userId, createdAt: { gt: new Date(now - 60_000) } } });
    return n >= limits.messagesPerMinute ? "You're sending messages too fast. Wait a moment." : null;
  }
  const n = await db.report.count({ where: { reporterId: userId, createdAt: { gt: new Date(now - 86_400_000) } } });
  return n >= limits.reportsPerDay ? "You've sent several reports today. Our team is reviewing them." : null;
}
