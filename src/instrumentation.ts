import type { Instrumentation } from "next";

/* Runs once per server start. Lists missing or test-mode production settings loudly
   (key names only, never values), and forwards every uncaught server error (pages,
   route handlers, server actions, proxy) to Sentry through lib/monitoring. */

export async function register() {
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { checkProductionEnv, formatProblems } = await import("./lib/env-check");
  const problems = checkProductionEnv();
  if (problems.length) console.error(`\n[startup] Production configuration:\n${formatProblems(problems)}\n`);
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { reportError } = await import("./lib/monitoring/server");
  await reportError(err, {
    path: request.path,
    tags: { area: "server", method: request.method, routeType: context.routeType, route: context.routePath },
  });
};
