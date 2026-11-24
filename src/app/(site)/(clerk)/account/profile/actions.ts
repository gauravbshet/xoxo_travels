"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ageOn } from "@/lib/profile";
import { createUpload, extFor, publicUrl, removeObject, type UploadTicket } from "@/lib/storage";
import { verifyUpload } from "@/lib/uploads";
import { idDocumentTypes, profile as rules, uploads } from "@/config/profile";

type Result = { ok: true } | { ok: false; message: string };

async function me() {
  if (!db) return null;
  return getCurrentUser();
}

const genders = rules.genders.map((g) => g.value) as [string, ...string[]];
const profileSchema = z.object({
  displayName: z.string().trim().min(rules.displayName.min, "Enter a display name of at least 2 characters.").max(rules.displayName.max, "Display name is too long."),
  bio: z.string().trim().max(rules.bioMax, `Keep your bio under ${rules.bioMax} characters.`),
  city: z.string().trim().min(2, "Enter your city.").max(60, "City is too long."),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth."),
  gender: z.enum(genders, { error: "Choose a gender option." }),
  interests: z.array(z.enum(rules.interests as unknown as [string, ...string[]])).max(rules.maxInterests, `Pick up to ${rules.maxInterests} interests.`),
  languages: z.array(z.enum(rules.languages as unknown as [string, ...string[]])).max(rules.maxLanguages, `Pick up to ${rules.maxLanguages} languages.`),
});

export async function saveProfile(input: unknown): Promise<Result> {
  const user = await me();
  if (!user) return { ok: false, message: "Sign in to save your profile." };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  const p = parsed.data;
  const dob = new Date(p.dateOfBirth);
  if (Number.isNaN(dob.getTime()) || dob > new Date()) return { ok: false, message: "Enter a valid date of birth." };
  if (ageOn(p.dateOfBirth) < rules.minAge) return { ok: false, message: `You must be ${rules.minAge} or older to use XOXO Travels.` };
  if (ageOn(p.dateOfBirth) > 110) return { ok: false, message: "Enter a valid date of birth." };

  const data = { displayName: p.displayName, bio: p.bio || null, city: p.city, dateOfBirth: dob, gender: p.gender as "female" | "male" | "other" | "prefer_not_to_say", interests: p.interests, languages: p.languages };
  await db!.profile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
  return { ok: true };
}

/* ───────── uploads ───────── */

const uploadSchema = z.object({ kind: z.enum(["photo", "id"]), contentType: z.string().max(60), size: z.number().int().positive() });

/** Step 1: a short-lived upload link. The browser PUTs the file there directly. */
export async function requestUpload(input: unknown): Promise<({ ok: true } & UploadTicket) | { ok: false; message: string }> {
  const user = await me();
  if (!user) return { ok: false, message: "Sign in to upload." };
  const parsed = uploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid upload." };
  const { kind, contentType, size } = parsed.data;
  const rule = uploads[kind];
  if (!(rule.types as readonly string[]).includes(contentType)) return { ok: false, message: kind === "photo" ? "Use a JPG, PNG or WebP photo." : "Use a JPG, PNG, WebP or PDF file." };
  if (size > rule.maxBytes) return { ok: false, message: `The file must be ${Math.round(rule.maxBytes / 1024 / 1024)} MB or smaller.` };
  if (kind === "id") {
    const blocked = await idBlocked(user.id);
    if (blocked) return { ok: false, message: blocked };
  }
  const key = `${kind === "photo" ? "avatars" : "ids"}/${user.id.toLowerCase()}/${randomBytes(12).toString("hex")}.${extFor[contentType]}`;
  const ticket = await createUpload(kind === "photo" ? "public" : "private", key, contentType, rule.maxBytes, uploads.uploadUrlTtl);
  return { ok: true, ...ticket };
}

function checkUpload(kind: "photo" | "id", userId: string, key: string) {
  return verifyUpload(kind === "photo" ? "public" : "private", key, `${kind === "photo" ? "avatars" : "ids"}/${userId.toLowerCase()}/`, uploads[kind]);
}

/** Step 2 for photos: attach the uploaded photo and delete the previous one. */
export async function confirmPhoto(key: unknown): Promise<({ ok: true; url: string }) | { ok: false; message: string }> {
  const user = await me();
  if (!user) return { ok: false, message: "Sign in to upload." };
  if (typeof key !== "string") return { ok: false, message: "Invalid upload." };
  const problem = await checkUpload("photo", user.id, key);
  if (problem) return { ok: false, message: problem };
  const old = await db!.profile.findUnique({ where: { userId: user.id }, select: { avatarKey: true } });
  await db!.profile.update({ where: { userId: user.id }, data: { avatarKey: key } });
  if (old?.avatarKey && old.avatarKey !== key) await removeObject("public", old.avatarKey).catch((e) => console.error("[storage] old photo not deleted:", e));
  return { ok: true, url: publicUrl(key) };
}

export async function removePhoto(): Promise<Result> {
  const user = await me();
  if (!user) return { ok: false, message: "Sign in first." };
  const p = await db!.profile.findUnique({ where: { userId: user.id }, select: { avatarKey: true } });
  if (!p?.avatarKey) return { ok: true };
  await db!.profile.update({ where: { userId: user.id }, data: { avatarKey: null } });
  await removeObject("public", p.avatarKey).catch((e) => console.error("[storage] photo not deleted:", e));
  return { ok: true };
}

/* ───────── ID verification ───────── */

async function idBlocked(userId: string): Promise<string | null> {
  const [p, pending] = await Promise.all([
    db!.profile.findUnique({ where: { userId }, select: { verified: true } }),
    db!.verification.findFirst({ where: { userId, status: "pending" }, select: { id: true } }),
  ]);
  if (p?.verified) return "Your profile is already verified.";
  if (pending) return "Your ID is already under review.";
  return null;
}

const docTypes = idDocumentTypes.map((d) => d.value) as unknown as [string, ...string[]];

/** Step 2 for IDs: queue the uploaded document for admin review. */
export async function submitVerification(input: unknown): Promise<Result> {
  const user = await me();
  if (!user) return { ok: false, message: "Sign in first." };
  const parsed = z.object({ key: z.string(), documentType: z.enum(docTypes, { error: "Choose the ID type." }) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid submission." };
  const blocked = await idBlocked(user.id);
  if (blocked) { await removeObject("private", parsed.data.key).catch(() => {}); return { ok: false, message: blocked }; }
  const problem = await checkUpload("id", user.id, parsed.data.key);
  if (problem) return { ok: false, message: problem };
  await db!.verification.create({ data: { userId: user.id, documentKey: parsed.data.key, documentType: parsed.data.documentType } });
  return { ok: true };
}
