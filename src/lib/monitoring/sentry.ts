/* A small Sentry client: one POST of an "envelope" to Sentry's ingest API.
   No SDK, so nothing is added to the browser bundle and nothing patches globals.
   Shared by the server reporter and the browser reporter.

   What it sends: error type, message, stack, the page path (no query string),
   environment and a few tags. It never sends cookies, headers, request bodies or
   form data. If you later want tracing, session replay or source-map upload,
   swap this for @sentry/nextjs; the call sites (reportError) stay the same. */

export type ErrorContext = { path?: string; tags?: Record<string, string>; extra?: Record<string, unknown> };

type Dsn = { key: string; endpoint: string; dsn: string };

export function parseDsn(dsn: string | undefined): Dsn | null {
  if (!dsn?.trim()) return null;
  try {
    const u = new URL(dsn.trim());
    const projectId = u.pathname.replace(/^\/+|\/+$/g, "");
    if (!u.username || !projectId || u.protocol !== "https:") return null;
    return { key: u.username, endpoint: `${u.origin}/api/${projectId}/envelope/`, dsn: dsn.trim() };
  } catch { return null; }
}

const hex = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");

/** Basic V8/Firefox stack parsing into Sentry frames (oldest first). */
function frames(stack: string | undefined) {
  if (!stack) return undefined;
  const out = stack.split("\n").slice(1, 40).map((line) => {
    const m = line.match(/at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/) ?? line.match(/^(.*)@(.+?):(\d+):(\d+)$/);
    return m ? { function: m[1] || "?", filename: m[2], lineno: Number(m[3]), colno: Number(m[4]), in_app: !/node_modules|node:/.test(m[2]) } : null;
  }).filter((f): f is NonNullable<typeof f> => f !== null).reverse();
  return out.length ? { frames: out } : undefined;
}

const stripQuery = (p?: string) => p?.split("?")[0]?.slice(0, 300);

export function buildEnvelope(d: Dsn, err: unknown, ctx: ErrorContext & { platform: "node" | "javascript" }) {
  const e = err instanceof Error ? err : new Error(typeof err === "string" ? err : "Non-error thrown");
  const digest = typeof err === "object" && err && "digest" in err ? String((err as { digest: unknown }).digest) : undefined;
  const event_id = hex(16);
  const event = {
    event_id,
    timestamp: Date.now() / 1000,
    platform: ctx.platform,
    level: "error",
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "production",
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 12),
    transaction: stripQuery(ctx.path),
    tags: { ...ctx.tags, ...(digest && { digest }) },
    extra: ctx.extra,
    exception: { values: [{ type: e.name || "Error", value: e.message.slice(0, 1000), stacktrace: frames(e.stack) }] },
    ...(ctx.path && { request: { url: stripQuery(ctx.path) } }),
  };
  const header = { event_id, sent_at: new Date().toISOString(), dsn: d.dsn };
  return { event_id, body: `${JSON.stringify(header)}\n${JSON.stringify({ type: "event" })}\n${JSON.stringify(event)}` };
}

export async function sendToSentry(d: Dsn, body: string, keepalive = false) {
  const res = await fetch(d.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-sentry-envelope", "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${d.key}, sentry_client=xoxo-travels/1.0` },
    body,
    keepalive,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Sentry rejected the event (${res.status})`);
}
