"use client";

import { requestUpload } from "@/app/(site)/(clerk)/account/profile/actions";

/** Gets a signed link from the server, then PUTs the file straight to storage. Returns the object key. */
export async function uploadFile(kind: "photo" | "id", file: File): Promise<{ ok: true; key: string } | { ok: false; message: string }> {
  const ticket = await requestUpload({ kind, contentType: file.type, size: file.size });
  if (!ticket.ok) return ticket;
  try {
    const res = await fetch(ticket.url, { method: ticket.method, headers: ticket.headers, body: file });
    if (!res.ok) return { ok: false, message: res.status === 413 ? "The file is too large." : "Upload failed. Try again." };
  } catch {
    return { ok: false, message: "Upload failed. Check your connection and try again." };
  }
  return { ok: true, key: ticket.key };
}
