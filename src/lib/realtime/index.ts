import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { EventEmitter } from "node:events";

/* Live updates behind one interface, so the provider can change (Socket.io later)
   without touching chat code. Messages are always saved to Postgres BEFORE publish;
   a lost live event only means the other side sees it on next load.

   - "ably":  Ably over its REST API. Browsers subscribe with EventSource to Ably's SSE
              endpoint using a short-lived token that can only read their own channel.
   - "local": development only. An in-process emitter + our own SSE route.
   In production without ABLY_API_KEY, connectUrl() throws (chat still saves and loads). */

export type RealtimeEvent = { type: "message"; message: unknown } | { type: "closed" };

const real = (v: string | undefined) => (v && v.trim() && !/x{5,}/i.test(v) ? v.trim() : undefined);
const ablyKey = () => real(process.env.ABLY_API_KEY);

export function realtimeMode(): "ably" | "local" {
  if (ablyKey()) return "ably";
  if (process.env.NODE_ENV === "production") throw new Error("ABLY_API_KEY is not set; live chat updates are off.");
  return "local";
}

export const channelFor = (conversationId: string) => `chat:${conversationId}`;

/* ───────── local (dev) ───────── */

const g = globalThis as unknown as { __xoxoBus?: EventEmitter };
export const localBus = g.__xoxoBus ?? (g.__xoxoBus = new EventEmitter().setMaxListeners(0));

const secret = () => process.env.LOCAL_UPLOAD_SECRET || "dev-only-local-upload-secret";
const sig = (channel: string, exp: string) => createHmac("sha256", secret()).update(`rt|${channel}|${exp}`).digest("hex");
export function verifyLocalStream(channel: string, exp: string, given: string) {
  const a = Buffer.from(sig(channel, exp)), b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b) && Number(exp) * 1000 > Date.now();
}

/* ───────── API ───────── */

/** Push an event to everyone watching a channel. Never throws: delivery is best effort. */
export async function publish(channel: string, event: RealtimeEvent) {
  try {
    if (realtimeMode() === "local") { localBus.emit(channel, event); return; }
    const key = ablyKey()!;
    const res = await fetch(`https://rest.ably.io/channels/${encodeURIComponent(channel)}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(key).toString("base64")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: event.type, data: JSON.stringify(event) }),
      cache: "no-store",
    });
    if (!res.ok) console.error(`[realtime] publish failed (${res.status})`);
  } catch (e) {
    console.error("[realtime] publish failed:", e instanceof Error ? e.message : e);
  }
}

/** A URL the browser opens with EventSource to receive one channel. Subscribe-only. */
export async function connectUrl(channel: string, clientId: string, ttlSeconds: number): Promise<string> {
  if (realtimeMode() === "local") {
    const exp = String(Math.floor(Date.now() / 1000) + ttlSeconds);
    return `/api/realtime/local?${new URLSearchParams({ channel, exp, sig: sig(channel, exp) })}`;
  }
  const key = ablyKey()!;
  const keyName = key.split(":")[0];
  const res = await fetch(`https://rest.ably.io/keys/${encodeURIComponent(keyName)}/requestToken`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(key).toString("base64")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ keyName, clientId, ttl: ttlSeconds * 1000, capability: JSON.stringify({ [channel]: ["subscribe"] }), timestamp: Date.now() }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Ably token request failed (${res.status})`);
  const { token } = (await res.json()) as { token: string };
  return `https://realtime.ably.io/event-stream?${new URLSearchParams({ channels: channel, v: "1.2", accessToken: token, enveloped: "false" })}`;
}
