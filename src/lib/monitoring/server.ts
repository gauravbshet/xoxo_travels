import { buildEnvelope, parseDsn, sendToSentry, type ErrorContext } from "./sentry";

/* Server-side error reporting.
   - DSN set: sends to Sentry (and logs).
   - DSN missing in development: logs to the console only.
   - DSN missing in production: logs, and instrumentation.ts prints a loud warning at startup.
   Never throws: reporting an error must not cause another one. */

const dsn = () => parseDsn(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);

export function monitoringMode(): "sentry" | "console" {
  return dsn() ? "sentry" : "console";
}

export async function reportError(err: unknown, ctx: ErrorContext = {}) {
  const tag = ctx.tags?.area ? `[${ctx.tags.area}]` : "[error]";
  console.error(tag, err instanceof Error ? err.message : err, ctx.path ?? "");
  const d = dsn();
  if (!d) return;
  try {
    const { body } = buildEnvelope(d, err, { ...ctx, platform: "node" });
    await sendToSentry(d, body);
  } catch (e) {
    console.error("[monitoring] could not reach Sentry:", e instanceof Error ? e.message : e);
  }
}
