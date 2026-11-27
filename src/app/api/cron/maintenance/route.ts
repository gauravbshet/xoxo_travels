import { timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { runMaintenance } from "@/lib/maintenance";
import { reportError } from "@/lib/monitoring/server";

/* Called once a day by Vercel Cron (see vercel.json). Vercel sends
   "Authorization: Bearer $CRON_SECRET". In production the secret is required;
   in development the route runs without one so you can try it locally. */

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(req: Request) {
  await connection();
  if (!authorized(req)) {
    if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET?.trim()) console.error("[cron] CRON_SECRET is not set; maintenance refused.");
    return Response.json({ ok: false }, { status: 401 });
  }
  try {
    const result = await runMaintenance();
    console.info("[cron] maintenance", result);
    return Response.json({ ok: true, ...result });
  } catch (e) {
    await reportError(e, { tags: { area: "cron" } });
    return Response.json({ ok: false }, { status: 500 });
  }
}
