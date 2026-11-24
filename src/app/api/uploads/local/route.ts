import { writeFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { ensureLocalDir, KEY_RE, localPath, localUploadPayload, storageMode, verifyLocalSig, type Bucket } from "@/lib/storage";

/* Development stand-in for an R2 presigned PUT. Off in production and when R2 is configured. */
export async function PUT(req: Request) {
  if (process.env.NODE_ENV === "production" || storageMode() !== "local") return NextResponse.json({ error: "Not available" }, { status: 404 });

  const q = new URL(req.url).searchParams;
  const bucket = q.get("bucket"), key = q.get("key") ?? "", type = q.get("type") ?? "", max = q.get("max") ?? "", exp = q.get("exp") ?? "", sig = q.get("sig") ?? "";
  if ((bucket !== "public" && bucket !== "private") || !KEY_RE.test(key)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  if (!verifyLocalSig(localUploadPayload(bucket, key, type, max, exp), sig)) return NextResponse.json({ error: "Bad signature" }, { status: 403 });
  if (Number(exp) * 1000 < Date.now()) return NextResponse.json({ error: "Upload link expired" }, { status: 403 });
  if (req.headers.get("content-type") !== type) return NextResponse.json({ error: "Content type mismatch" }, { status: 400 });

  const body = new Uint8Array(await req.arrayBuffer());
  if (body.byteLength === 0 || body.byteLength > Number(max)) return NextResponse.json({ error: "File too large" }, { status: 413 });

  await ensureLocalDir(bucket as Bucket, key);
  await writeFile(localPath(bucket as Bucket, key), body);
  return new NextResponse(null, { status: 200 });
}
