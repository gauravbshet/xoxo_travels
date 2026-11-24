import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { KEY_RE, localPath, storageMode } from "@/lib/storage";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/* Development only: serves public-bucket files (profile photos) from ./.uploads.
   In production, photos come straight from the R2 public URL. */
export async function GET(_req: Request, ctx: RouteContext<"/api/media/[...key]">) {
  if (process.env.NODE_ENV === "production" || storageMode() !== "local") return new NextResponse(null, { status: 404 });
  const key = (await ctx.params).key.join("/");
  const ext = key.split(".").pop() ?? "";
  if (!KEY_RE.test(key) || !key.startsWith("avatars/") || !TYPES[ext]) return new NextResponse(null, { status: 404 });
  try {
    const body = await readFile(localPath("public", key));
    return new NextResponse(body, { headers: { "Content-Type": TYPES[ext], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
