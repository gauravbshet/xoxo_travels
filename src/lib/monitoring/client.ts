"use client";

import { buildEnvelope, parseDsn } from "./sentry";

/* Browser error reporting straight to Sentry with the public DSN.
   Capped at 5 reports per page load and de-duplicated, so a render loop can't flood
   Sentry. Without a DSN it only logs to the console. */

const d = parseDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
const seen = new Set<string>();
let sent = 0;

// Noise from extensions and the browser itself, not from our code.
const IGNORE = [/ResizeObserver loop/, /^Script error\.?$/, /chrome-extension:|moz-extension:/, /Load failed|NetworkError|Failed to fetch/];

export function reportClientError(err: unknown, tags: Record<string, string> = {}) {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  if (IGNORE.some((r) => r.test(msg) || (err instanceof Error && r.test(err.stack ?? "")))) return;
  console.error(err);
  if (!d || sent >= 5 || seen.has(msg)) return;
  seen.add(msg);
  sent += 1;
  const { body } = buildEnvelope(d, err, { platform: "javascript", path: location.pathname, tags: { runtime: "browser", ...tags } });
  // Auth goes in the query string so the request stays "simple" (no CORS preflight).
  void fetch(`${d.endpoint}?sentry_key=${d.key}&sentry_version=7&sentry_client=xoxo-travels/1.0`, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" }, // simple request, no CORS preflight
    body: body,
    keepalive: true,
  }).catch(() => {});
}
