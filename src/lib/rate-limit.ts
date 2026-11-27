import "server-only";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { limits } from "@/config/partners";
import type { RateRule } from "@/config/security";
import { hit, ipFrom, waitText } from "@/lib/rate-limit-core";

/* Two kinds of limits:
   - overLimit(): daily quotas counted from rows already in Postgres (exact, survives restarts).
   - limit():     short-window burst limits in Upstash (memory in dev), see config/security.ts. */

/** Returns a message to show when `id` is over the `rule` limit, else null. */
export async function limit(rule: RateRule, id: string): Promise<string | null> {
  try {
    const r = await hit(rule, id);
    return r.ok ? null : `Too many attempts. Try again in ${waitText(r.retryAfterSec)}.`;
  } catch (e) {
    // Production without Upstash: refuse loudly rather than run unprotected.
    console.error("[rate-limit]", e instanceof Error ? e.message : e);
    return "This is unavailable right now. Try again later.";
  }
}

/** The caller's IP address, for limits on actions that don't need sign-in. */
export async function clientIp() {
  return ipFrom(await headers());
}

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
