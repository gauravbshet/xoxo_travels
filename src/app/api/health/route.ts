import { connection } from "next/server";
import { db } from "@/lib/db";

/* Uptime check for monitors (UptimeRobot, Better Stack, Vercel checks).
   200 when the app and database answer, 503 otherwise. Reveals nothing sensitive. */
export async function GET() {
  await connection();
  const started = Date.now();
  let database: "ok" | "down" | "not configured" = "not configured";
  if (db) {
    try {
      await db.$queryRaw`SELECT 1`;
      database = "ok";
    } catch {
      database = "down";
    }
  }
  const ok = database !== "down";
  return Response.json(
    { ok, database, ms: Date.now() - started },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
