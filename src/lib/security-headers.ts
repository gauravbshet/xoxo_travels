/* Security headers for every response, built from the env at build time.
   Imported by next.config.ts, so relative imports only (no "@/" alias here).

   The CSP lists exactly the outside origins the site talks to:
   Clerk (sign-in), Razorpay (checkout popup), Ably (live chat), R2 (uploads and
   photos), Sentry (error reports) and Unsplash (catalog images).

   It's set without nonces on purpose: a nonce forces every page to render per
   request, which would switch off the static/partial prerendering and caching the
   site relies on. Next.js inlines its own bootstrap scripts, so script-src keeps
   'unsafe-inline'; everything else (objects, framing, base, form targets, and all
   unlisted script origins) is locked down. */

import { cspMode } from "../config/security";

const origin = (url: string | undefined) => {
  try { return url ? new URL(url).origin : null; } catch { return null; }
};

/** Clerk's Frontend API host is encoded in the publishable key: pk_(test|live)_base64("host$"). */
function clerkHost(): string | null {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const m = pk?.match(/^pk_(?:test|live)_(.+)$/);
  if (!m) return null;
  try {
    const host = Buffer.from(m[1], "base64").toString("utf8").replace(/\$$/, "");
    return /^[a-z0-9.-]+$/i.test(host) ? `https://${host}` : null;
  } catch { return null; }
}

/** Sentry ingest origin from the DSN (https://key@o123.ingest.sentry.io/456). */
function sentryOrigin(): string | null {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  try { return dsn ? new URL(dsn).origin : null; } catch { return null; }
}

export function buildCsp() {
  const dev = process.env.NODE_ENV !== "production";
  const https = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
  const clerk = clerkHost();
  const media = origin(process.env.NEXT_PUBLIC_MEDIA_BASE_URL);
  const sentry = sentryOrigin();
  const list = (...xs: (string | null | false | undefined)[]) => xs.filter(Boolean).join(" ");

  const directives: Record<string, string> = {
    "default-src": "'self'",
    "script-src": list("'self'", "'unsafe-inline'", dev && "'unsafe-eval'", clerk, "https://challenges.cloudflare.com", "https://checkout.razorpay.com"),
    "style-src": "'self' 'unsafe-inline'",
    "img-src": list("'self'", "data:", "blob:", "https://images.unsplash.com", "https://img.clerk.com", media, "https://*.r2.cloudflarestorage.com", "https://*.razorpay.com"),
    "font-src": "'self' data:",
    "connect-src": list(
      "'self'", dev && "ws://localhost:* ws://127.0.0.1:*", clerk,
      "https://api.razorpay.com", "https://lumberjack.razorpay.com",
      "https://*.ably.io", "https://*.ably-realtime.com", "https://*.ably.net",
      "https://*.r2.cloudflarestorage.com", sentry,
    ),
    "frame-src": "https://api.razorpay.com https://checkout.razorpay.com https://challenges.cloudflare.com",
    "worker-src": "'self' blob:",
    "media-src": list("'self'", media),
    "object-src": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
    "frame-ancestors": "'none'",
    "manifest-src": "'self'",
  };
  const csp = Object.entries(directives).map(([k, v]) => `${k} ${v}`).join("; ") + (https ? "; upgrade-insecure-requests" : "");
  return csp;
}

export function securityHeaders() {
  return [
    { key: cspMode === "report-only" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy", value: buildCsp() },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    // Popups must keep their opener for Razorpay checkout and Clerk social sign-in.
    { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
    // Geolocation is used by Find a partner on our own origin only; payment for Razorpay.
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self \"https://api.razorpay.com\" \"https://checkout.razorpay.com\"), usb=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-DNS-Prefetch-Control", value: "on" },
  ];
}
