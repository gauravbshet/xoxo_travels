import { rateRules, requireUpstashInProduction, type RateRule } from "@/config/security";

/* Fixed-window counters behind one function, usable from the proxy and server code.
   - Upstash keys set: counts in Upstash Redis over its REST API (one fetch, no SDK),
     so limits hold across every server instance.
   - Keys missing in development: counts in this process's memory.
   - Keys missing in production: throws, unless config/security.ts allows memory.
   If Upstash itself is unreachable we let the request through and log it: a Redis
   outage shouldn't take checkout down. */

const real = (v: string | undefined) => (v && v.trim() && !/x{5,}/i.test(v) ? v.trim() : undefined);
const upstash = () => {
  const url = real(process.env.UPSTASH_REDIS_REST_URL), token = real(process.env.UPSTASH_REDIS_REST_TOKEN);
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
};

export function rateLimitMode(): "upstash" | "memory" {
  if (upstash()) return "upstash";
  if (process.env.NODE_ENV === "production" && requireUpstashInProduction) {
    throw new Error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set; rate limiting is off. Add them or set requireUpstashInProduction=false.");
  }
  return "memory";
}

const g = globalThis as unknown as { __xoxoRate?: Map<string, { n: number; exp: number }> };
const mem = g.__xoxoRate ?? (g.__xoxoRate = new Map());

export type LimitResult = { ok: boolean; remaining: number; retryAfterSec: number };

/** Counts one hit for `id` under `rule`. ok=false once the window's limit is passed. */
export async function hit(rule: RateRule, id: string): Promise<LimitResult> {
  const { limit, windowSec } = rateRules[rule];
  const now = Date.now();
  const windowStart = Math.floor(now / 1000 / windowSec) * windowSec;
  const retryAfterSec = windowStart + windowSec - Math.floor(now / 1000);
  const key = `rl:${rule}:${id}:${windowStart}`;

  if (rateLimitMode() === "memory") {
    if (mem.size > 10_000) for (const [k, v] of mem) if (v.exp < now) mem.delete(k);
    const e = mem.get(key) ?? { n: 0, exp: now + windowSec * 1000 };
    e.n += 1;
    mem.set(key, e);
    return { ok: e.n <= limit, remaining: Math.max(0, limit - e.n), retryAfterSec };
  }

  const u = upstash()!;
  try {
    const res = await fetch(`${u.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${u.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", key], ["EXPIRE", key, String(windowSec + 5)]]),
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) throw new Error(`Upstash ${res.status}`);
    const [first] = (await res.json()) as [{ result?: number; error?: string }];
    if (typeof first?.result !== "number") throw new Error(first?.error ?? "bad Upstash reply");
    return { ok: first.result <= limit, remaining: Math.max(0, limit - first.result), retryAfterSec };
  } catch (e) {
    console.error(`[rate-limit] Upstash unavailable, allowing request (${rule}):`, e instanceof Error ? e.message : e);
    return { ok: true, remaining: limit, retryAfterSec: 0 };
  }
}

export function waitText(sec: number) {
  if (sec < 90) return "a minute";
  if (sec < 3600) return `${Math.ceil(sec / 60)} minutes`;
  return sec < 7200 ? "an hour" : `${Math.ceil(sec / 3600)} hours`;
}

/** First address in x-forwarded-for (set by Vercel and most proxies), else x-real-ip. */
export function ipFrom(h: Headers) {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
}
