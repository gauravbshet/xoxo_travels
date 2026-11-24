"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { conversationFor, toMessageView, type MessageView } from "@/lib/chat";
import { overLimit } from "@/lib/rate-limit";
import { channelFor, connectUrl, publish } from "@/lib/realtime";
import { createUpload, extFor, type UploadTicket } from "@/lib/storage";
import { verifyUpload } from "@/lib/uploads";
import { chat as rules } from "@/config/partners";
import { uploads } from "@/config/profile";

async function access(conversationId: unknown) {
  if (!db || typeof conversationId !== "string") return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const c = await conversationFor(user.id, conversationId);
  return c ? { user, c } : null;
}

const imagePrefix = (conversationId: string) => `chat/${conversationId.toLowerCase()}/`;

/** Saves the message to Postgres first, then pushes it live. Blocks are enforced here. */
export async function sendMessage(input: unknown): Promise<{ ok: true; message: MessageView } | { ok: false; message: string }> {
  const parsed = z.object({
    conversationId: z.string().min(1),
    body: z.string().trim().max(rules.messageMax, `Keep messages under ${rules.messageMax} characters.`).optional(),
    imageKey: z.string().optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid message." };
  const a = await access(parsed.data.conversationId);
  if (!a) return { ok: false, message: "You can't send to this chat." };
  if (a.c.closed) return { ok: false, message: "This chat is closed." };
  const { body, imageKey } = parsed.data;
  if (!body && !imageKey) return { ok: false, message: "Type a message." };
  const limited = await overLimit("message", a.user.id);
  if (limited) return { ok: false, message: limited };
  if (imageKey) {
    const problem = await verifyUpload("private", imageKey, imagePrefix(a.c.id), uploads.photo);
    if (problem) return { ok: false, message: problem };
  }

  const now = new Date();
  const saved = await db!.$transaction(async (tx) => {
    const m = await tx.message.create({ data: { conversationId: a.c.id, senderId: a.user.id, kind: imageKey ? "image" : "text", body: body || null, imageKey: imageKey ?? null } });
    await tx.conversation.update({ where: { id: a.c.id }, data: { lastMessageAt: now } });
    await tx.participant.update({ where: { conversationId_userId: { conversationId: a.c.id, userId: a.user.id } }, data: { lastReadAt: now } });
    return m;
  });
  const view = await toMessageView(saved);
  await publish(channelFor(a.c.id), { type: "message", message: view });
  return { ok: true, message: view };
}

export async function requestChatImage(input: unknown): Promise<({ ok: true } & UploadTicket) | { ok: false; message: string }> {
  const parsed = z.object({ conversationId: z.string().min(1), contentType: z.string().max(60), size: z.number().int().positive() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid upload." };
  const a = await access(parsed.data.conversationId);
  if (!a || a.c.closed) return { ok: false, message: "You can't send to this chat." };
  const { contentType, size } = parsed.data;
  if (!(uploads.photo.types as readonly string[]).includes(contentType)) return { ok: false, message: "Use a JPG, PNG or WebP photo." };
  if (size > uploads.photo.maxBytes) return { ok: false, message: `Photos must be ${Math.round(uploads.photo.maxBytes / 1024 / 1024)} MB or smaller.` };
  const key = `${imagePrefix(a.c.id)}${randomBytes(12).toString("hex")}.${extFor[contentType]}`;
  return { ok: true, ...(await createUpload("private", key, contentType, uploads.photo.maxBytes, uploads.uploadUrlTtl)) };
}

/** A subscribe-only live-update URL for this chat. */
export async function connectChat(conversationId: unknown): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const a = await access(conversationId);
  if (!a || a.c.closed) return { ok: false, message: "Chat unavailable." };
  try {
    return { ok: true, url: await connectUrl(channelFor(a.c.id), a.user.id, rules.tokenTtl) };
  } catch (e) {
    console.error("[realtime] connect failed:", e instanceof Error ? e.message : e);
    return { ok: false, message: "Live updates are unavailable. New messages appear when you reload." };
  }
}

export async function markRead(conversationId: unknown): Promise<void> {
  const a = await access(conversationId);
  if (!a) return;
  await db!.participant.update({ where: { conversationId_userId: { conversationId: a.c.id, userId: a.user.id } }, data: { lastReadAt: new Date() } });
}
