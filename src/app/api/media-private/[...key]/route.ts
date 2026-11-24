import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { KEY_RE, localPath, localViewPayload, storageMode, verifyLocalSig } from "@/lib/storage";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf" };

/* Development only: serves an ID document through a short-lived signed link
   (made by privateViewUrl for admins viewing IDs, or chat participants viewing photos). In production, R2 presigned GETs replace this. */
export async function GET(req: Request, ctx: RouteContext<"/api/media-private/[...key]">) {
  if (process.env.NODE_ENV === "production" || storageMode() !== "local") return new NextResponse(null, { status: 404 });
  const key = (await ctx.params).key.join("/");
  const q = new URL(req.url).searchParams;
  const exp = q.get("exp") ?? "", sig = q.get("sig") ?? "";
  const ext = key.split(".").pop() ?? "";
  if (!KEY_RE.test(key) || !(key.startsWith("ids/") || key.startsWith("chat/")) || !TYPES[ext]) return new NextResponse(null, { status: 404 });
  if (!verifyLocalSig(localViewPayload(key, exp), sig) || Number(exp) * 1000 < Date.now()) return new NextResponse("Link expired", { status: 403 });
  try {
    const body = await readFile(localPath("private", key));
    return new NextResponse(body, { headers: { "Content-Type": TYPES[ext], "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
