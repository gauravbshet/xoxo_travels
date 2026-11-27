"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { areBlocked, partnerStatus } from "@/lib/partners";
import { limit, overLimit } from "@/lib/rate-limit";
import { roundCoord } from "@/lib/geo";
import { channelFor, publish } from "@/lib/realtime";
import { partners as rules } from "@/config/partners";

type Result = { ok: true } | { ok: false; message: string };

async function me() {
  if (!db) return null;
  return getCurrentUser();
}

/** Every partner action needs a complete, discoverable profile. */
async function readyUser() {
  const user = await me();
  if (!user) return { user: null, error: "Sign in to continue." } as const;
  const s = await partnerStatus(user.id);
  if (s.missing.length) return { user: null, error: "Finish your profile first." } as const;
  if (!s.discoverable) return { user: null, error: "Turn on \"Show me in Find a Partner\" on your profile first." } as const;
  return { user, error: null } as const;
}

/* ───────── visibility ───────── */

export async function setDiscoverable(on: unknown): Promise<Result> {
  const user = await me();
  if (!user) return { ok: false, message: "Sign in first." };
  if (typeof on !== "boolean") return { ok: false, message: "Invalid request." };
  if (on) {
    const s = await partnerStatus(user.id);
    if (s.missing.length) return { ok: false, message: "Finish the required profile fields first." };
  }
  await db!.profile.update({ where: { userId: user.id }, data: { discoverable: on } });
  // Hiding yourself also pauses your trips' visibility (they're filtered by discoverable).
  return { ok: true };
}

/* ───────── trips ───────── */

const tripSchema = z.object({
  destinationId: z.string().optional(),
  destinationText: z.string().trim().max(60).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a start date."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an end date."),
  note: z.string().trim().max(rules.noteMax, `Keep the note under ${rules.noteMax} characters.`).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function declareTrip(input: unknown): Promise<Result> {
  const { user, error } = await readyUser();
  if (!user) return { ok: false, message: error };
  { const l = await limit("partnerTrip", user.id); if (l) return { ok: false, message: l }; }
  const parsed = tripSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  const t = parsed.data;
  const today = new Date().toISOString().slice(0, 10);
  if (t.endDate < t.startDate) return { ok: false, message: "The end date must be on or after the start date." };
  if (t.endDate < today) return { ok: false, message: "Pick dates in the future." };

  let destinationId: string | null = null;
  let destinationText = t.destinationText ?? "";
  if (t.destinationId) {
    const d = await db!.destination.findUnique({ where: { id: t.destinationId }, select: { id: true, name: true } });
    if (!d) return { ok: false, message: "Pick a destination." };
    destinationId = d.id; destinationText = d.name;
  }
  if (destinationText.length < 2) return { ok: false, message: "Pick or type a destination." };

  const active = await db!.partnerTrip.count({ where: { userId: user.id, active: true, endDate: { gte: new Date(today) } } });
  if (active >= rules.maxActiveTrips) return { ok: false, message: `You can have ${rules.maxActiveTrips} trips at a time. End one first.` };

  await db!.partnerTrip.create({
    data: {
      userId: user.id, destinationId, destinationText,
      startDate: new Date(t.startDate), endDate: new Date(t.endDate),
      // Rounded (~1 km) before saving. Never shown to anyone.
      lat: roundCoord(t.lat, rules.coordDecimals), lng: roundCoord(t.lng, rules.coordDecimals),
      cityLabel: user.profile?.city ?? "",
      note: t.note || null,
    },
  });
  return { ok: true };
}

export async function endTrip(id: unknown): Promise<Result> {
  const user = await me();
  if (!user || typeof id !== "string") return { ok: false, message: "Invalid request." };
  await db!.partnerTrip.updateMany({ where: { id, userId: user.id }, data: { active: false } });
  return { ok: true };
}

/* ───────── requests ───────── */

export async function sendRequest(input: unknown): Promise<Result> {
  const { user, error } = await readyUser();
  if (!user) return { ok: false, message: error };
  const parsed = z.object({ toId: z.string().min(1), message: z.string().trim().max(rules.requestMessageMax).optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Keep your message under 300 characters." };
  const { toId, message } = parsed.data;
  if (toId === user.id) return { ok: false, message: "You can't send a request to yourself." };
  if (await areBlocked(user.id, toId)) return { ok: false, message: "This traveler isn't available." };
  const target = await db!.profile.findUnique({ where: { userId: toId }, select: { discoverable: true } });
  if (!target?.discoverable) return { ok: false, message: "This traveler isn't available." };
  const limited = await overLimit("request", user.id);
  if (limited) return { ok: false, message: limited };

  const reverse = await db!.partnerRequest.findUnique({ where: { fromId_toId: { fromId: toId, toId: user.id } }, select: { status: true } });
  if (reverse?.status === "pending") return { ok: false, message: "They already sent you a request. Accept it under Requests." };
  if (reverse?.status === "accepted") return { ok: false, message: "You're already connected." };

  const existing = await db!.partnerRequest.findUnique({ where: { fromId_toId: { fromId: user.id, toId } }, select: { status: true } });
  if (existing?.status === "pending") return { ok: false, message: "Request already sent." };
  if (existing?.status === "accepted") return { ok: false, message: "You're already connected." };
  if (existing?.status === "declined") return { ok: false, message: "This traveler isn't available." };

  await db!.partnerRequest.upsert({
    where: { fromId_toId: { fromId: user.id, toId } },
    create: { fromId: user.id, toId, message: message || null },
    update: { status: "pending", message: message || null, createdAt: new Date(), respondedAt: null },
  });
  return { ok: true };
}

export async function respondRequest(input: unknown): Promise<({ ok: true; conversationId?: string }) | { ok: false; message: string }> {
  const user = await me();
  if (!user) return { ok: false, message: "Sign in first." };
  const parsed = z.object({ id: z.string().min(1), accept: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const req = await db!.partnerRequest.findUnique({ where: { id: parsed.data.id }, select: { id: true, fromId: true, toId: true, status: true } });
  if (!req || req.toId !== user.id || req.status !== "pending") return { ok: false, message: "This request is no longer open." };
  if (await areBlocked(req.fromId, req.toId)) return { ok: false, message: "This traveler isn't available." };

  if (!parsed.data.accept) {
    await db!.partnerRequest.update({ where: { id: req.id }, data: { status: "declined", respondedAt: new Date() } });
    return { ok: true };
  }
  // Accepting opens the chat: conversation, both participants and a first system line.
  const convo = await db!.$transaction(async (tx) => {
    await tx.partnerRequest.update({ where: { id: req.id }, data: { status: "accepted", respondedAt: new Date() } });
    const c = await tx.conversation.create({
      data: { requestId: req.id, lastMessageAt: new Date(), participants: { create: [{ userId: req.fromId }, { userId: req.toId, lastReadAt: new Date() }] } },
      select: { id: true },
    });
    await tx.message.create({ data: { conversationId: c.id, senderId: user.id, kind: "system", body: "You're connected. Say hello and plan your trip." } });
    return c;
  });
  return { ok: true, conversationId: convo.id };
}

export async function withdrawRequest(id: unknown): Promise<Result> {
  const user = await me();
  if (!user || typeof id !== "string") return { ok: false, message: "Invalid request." };
  await db!.partnerRequest.updateMany({ where: { id, fromId: user.id, status: "pending" }, data: { status: "withdrawn" } });
  return { ok: true };
}

/* ───────── safety ───────── */

/** Blocks a traveler: hides both from each other, closes pending requests and their chat. Enforced server-side everywhere. */
export async function blockUser(targetId: unknown): Promise<Result> {
  const user = await me();
  if (!user || typeof targetId !== "string" || targetId === user.id) return { ok: false, message: "Invalid request." };
  if (!(await db!.user.findUnique({ where: { id: targetId }, select: { id: true } }))) return { ok: false, message: "Invalid request." };
  await db!.$transaction([
    db!.block.upsert({ where: { blockerId_blockedId: { blockerId: user.id, blockedId: targetId } }, create: { blockerId: user.id, blockedId: targetId }, update: {} }),
    db!.partnerRequest.updateMany({ where: { status: "pending", OR: [{ fromId: user.id, toId: targetId }, { fromId: targetId, toId: user.id }] }, data: { status: "withdrawn" } }),
  ]);
  const convo = await db!.conversation.findFirst({ where: { AND: [{ participants: { some: { userId: user.id } } }, { participants: { some: { userId: targetId } } }] }, select: { id: true } });
  if (convo) await publish(channelFor(convo.id), { type: "closed" });
  return { ok: true };
}

const reasons = rules.reportReasons.map((r) => r.value) as unknown as [string, ...string[]];

export async function reportUser(input: unknown): Promise<Result> {
  const user = await me();
  if (!user) return { ok: false, message: "Sign in first." };
  const parsed = z.object({
    targetId: z.string().min(1),
    reason: z.enum(reasons, { error: "Choose a reason." }),
    details: z.string().trim().max(1000, "Keep details under 1000 characters.").optional(),
    alsoBlock: z.boolean().optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid report." };
  const { targetId, reason, details, alsoBlock } = parsed.data;
  if (targetId === user.id) return { ok: false, message: "Invalid report." };
  if (!(await db!.user.findUnique({ where: { id: targetId }, select: { id: true } }))) return { ok: false, message: "Invalid report." };
  const limited = await overLimit("report", user.id);
  if (limited) return { ok: false, message: limited };
  await db!.report.create({ data: { reporterId: user.id, reportedId: targetId, reason, details: details || null } });
  if (alsoBlock) await blockUser(targetId);
  return { ok: true };
}
