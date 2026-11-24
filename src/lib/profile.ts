import "server-only";
import { db } from "@/lib/db";
import { publicUrl } from "@/lib/storage";
import { profile as rules, type GenderValue } from "@/config/profile";

export type ProfileView = {
  displayName: string;
  photoUrl: string | null;
  bio: string;
  city: string;
  dateOfBirth: string;
  gender: GenderValue | "";
  interests: string[];
  languages: string[];
  verified: boolean;
  discoverable: boolean;
  /** Fields from profile.requiredForPartner that are still empty. */
  missing: (typeof rules.requiredForPartner)[number][];
  verification: { status: "pending" | "approved" | "rejected"; note: string | null; documentType: string; createdAt: string } | null;
};

/** Whole years between an ISO date and today. */
export function ageOn(isoDob: string, today = new Date()) {
  const d = new Date(isoDob);
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export async function getProfileView(userId: string): Promise<ProfileView | null> {
  if (!db) return null;
  const [p, v] = await Promise.all([
    db.profile.findUnique({ where: { userId } }),
    db.verification.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { status: true, note: true, documentType: true, createdAt: true } }),
  ]);
  const name = p?.displayName && p.displayName !== "Traveler" ? p.displayName : "";
  const view = {
    displayName: name,
    photoUrl: p?.avatarKey ? publicUrl(p.avatarKey) : null,
    bio: p?.bio ?? "",
    city: p?.city ?? "",
    dateOfBirth: p?.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : "",
    gender: (p?.gender ?? "") as GenderValue | "",
    interests: p?.interests ?? [],
    languages: p?.languages ?? [],
    verified: p?.verified ?? false,
    discoverable: p?.discoverable ?? false,
    verification: v ? { status: v.status, note: v.note, documentType: v.documentType, createdAt: v.createdAt.toISOString() } : null,
  };
  const filled = { displayName: view.displayName, photo: view.photoUrl, city: view.city, dateOfBirth: view.dateOfBirth, gender: view.gender };
  return { ...view, missing: rules.requiredForPartner.filter((k) => !filled[k]) };
}
