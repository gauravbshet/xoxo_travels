import "server-only";
import { db } from "@/lib/db";
import { boundingBox, haversineKm, roughDistance } from "@/lib/geo";
import { ageOn, getProfileView } from "@/lib/profile";
import { publicUrl } from "@/lib/storage";
import { partners as rules } from "@/config/partners";
import type { Prisma } from "@/generated/prisma/client";

/* Find a Partner data. Coordinates are read here and never returned to callers. */

const iso = (d: Date) => d.toISOString().slice(0, 10);
const todayIso = () => new Date().toISOString().slice(0, 10);

/** Profile fields every visible traveler must have filled in. */
export const completeProfile = {
  discoverable: true,
  avatarKey: { not: null },
  city: { not: null },
  dateOfBirth: { not: null },
  gender: { not: null },
  displayName: { not: "Traveler" },
} satisfies Prisma.ProfileWhereInput;

/** Everyone this user has blocked or been blocked by. */
export async function blockedIds(userId: string): Promise<string[]> {
  if (!db) return [];
  const rows = await db.block.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] }, select: { blockerId: true, blockedId: true } });
  return [...new Set(rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId)))];
}

export async function areBlocked(a: string, b: string) {
  if (!db) return false;
  return (await db.block.count({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] } })) > 0;
}

/** Can this user use Find a Partner, and if not, why. */
export async function partnerStatus(userId: string) {
  const p = await getProfileView(userId);
  const discoverable = db ? (await db.profile.findUnique({ where: { userId }, select: { discoverable: true } }))?.discoverable ?? false : false;
  return { profile: p, missing: p?.missing ?? [], discoverable, ready: Boolean(p && p.missing.length === 0 && discoverable) };
}

export type MyTrip = { id: string; destination: string; startDate: string; endDate: string; note: string | null; cityLabel: string };

export async function myTrips(userId: string): Promise<MyTrip[]> {
  if (!db) return [];
  const rows = await db.partnerTrip.findMany({ where: { userId, active: true, endDate: { gte: new Date(todayIso()) } }, orderBy: { startDate: "asc" } });
  return rows.map((t) => ({ id: t.id, destination: t.destinationText, startDate: iso(t.startDate), endDate: iso(t.endDate), note: t.note, cityLabel: t.cityLabel }));
}

export type RequestState = "none" | "sent" | "received" | "connected" | "unavailable";

export type MatchCard = {
  userId: string;
  name: string;
  age: number | null;
  city: string;
  photoUrl: string | null;
  verified: boolean;
  gender: string | null;
  bio: string | null;
  sharedInterests: string[];
  sharedLanguages: string[];
  overlap: { start: string; end: string };
  distance: string;
  note: string | null;
  state: RequestState;
  conversationId: string | null;
};

/** Travelers going to the same place, on overlapping dates, within the radius of the viewer's trip location. */
export async function findMatches(viewerId: string, tripId: string, gender?: "female" | "male"): Promise<MatchCard[] | null> {
  if (!db) return null;
  const trip = await db.partnerTrip.findFirst({ where: { id: tripId, userId: viewerId, active: true } });
  if (!trip) return null;
  const [blocked, me] = await Promise.all([
    blockedIds(viewerId),
    db.profile.findUnique({ where: { userId: viewerId }, select: { interests: true, languages: true } }),
  ]);
  const box = boundingBox(trip.lat, trip.lng, rules.radiusKm);

  const candidates = await db.partnerTrip.findMany({
    where: {
      active: true,
      userId: { notIn: [viewerId, ...blocked] },
      endDate: { gte: new Date(todayIso()) },
      startDate: { lte: trip.endDate },
      AND: [
        { endDate: { gte: trip.startDate } },
        trip.destinationId ? { destinationId: trip.destinationId } : { destinationText: { equals: trip.destinationText, mode: "insensitive" } },
      ],
      lat: { gte: box.minLat, lte: box.maxLat },
      ...(box.maxLng - box.minLng >= 360 ? {} : { lng: { gte: box.minLng, lte: box.maxLng } }),
      user: { profile: { ...completeProfile, ...(gender && { gender }) } },
    },
    include: { user: { select: { id: true, profile: true } } },
    take: 500,
  });

  // One card per traveler: their closest matching trip.
  const best = new Map<string, { t: (typeof candidates)[number]; km: number }>();
  for (const c of candidates) {
    const km = haversineKm(trip, c);
    if (km > rules.radiusKm) continue;
    const prev = best.get(c.userId);
    if (!prev || km < prev.km) best.set(c.userId, { t: c, km });
  }
  const ids = [...best.keys()];
  if (!ids.length) return [];

  const reqs = await db.partnerRequest.findMany({
    where: { OR: [{ fromId: viewerId, toId: { in: ids } }, { toId: viewerId, fromId: { in: ids } }] },
    select: { fromId: true, toId: true, status: true, conversation: { select: { id: true } } },
  });
  const stateFor = (other: string): { state: RequestState; conversationId: string | null } => {
    const r = reqs.filter((x) => x.fromId === other || x.toId === other);
    const accepted = r.find((x) => x.status === "accepted");
    if (accepted) return { state: "connected", conversationId: accepted.conversation?.id ?? null };
    if (r.some((x) => x.toId === viewerId && x.status === "pending")) return { state: "received", conversationId: null };
    if (r.some((x) => x.fromId === viewerId && x.status === "pending")) return { state: "sent", conversationId: null };
    if (r.some((x) => x.status === "declined")) return { state: "unavailable", conversationId: null };
    return { state: "none", conversationId: null };
  };

  return [...best.values()]
    .sort((a, b) => a.km - b.km)
    .slice(0, rules.maxMatches)
    .map(({ t, km }) => {
      const p = t.user.profile!;
      const start = t.startDate > trip.startDate ? t.startDate : trip.startDate;
      const end = t.endDate < trip.endDate ? t.endDate : trip.endDate;
      return {
        userId: t.userId,
        name: p.displayName,
        age: p.dateOfBirth ? ageOn(p.dateOfBirth.toISOString()) : null,
        city: p.city ?? "",
        photoUrl: p.avatarKey ? publicUrl(p.avatarKey) : null,
        verified: p.verified,
        gender: p.gender,
        bio: p.bio,
        sharedInterests: p.interests.filter((i) => me?.interests.includes(i)),
        sharedLanguages: p.languages.filter((l) => me?.languages.includes(l)),
        overlap: { start: iso(start), end: iso(end) },
        distance: roughDistance(km),
        note: t.note,
        ...stateFor(t.userId),
      };
    });
}

export type PersonCard = { userId: string; name: string; age: number | null; city: string; photoUrl: string | null; verified: boolean };

export function personCard(u: { id: string; profile: { displayName: string; dateOfBirth: Date | null; city: string | null; avatarKey: string | null; verified: boolean } | null }): PersonCard {
  const p = u.profile;
  return { userId: u.id, name: p?.displayName ?? "Traveler", age: p?.dateOfBirth ? ageOn(p.dateOfBirth.toISOString()) : null, city: p?.city ?? "", photoUrl: p?.avatarKey ? publicUrl(p.avatarKey) : null, verified: p?.verified ?? false };
}

export const personSelect = { id: true, profile: { select: { displayName: true, dateOfBirth: true, city: true, avatarKey: true, verified: true } } } as const;

export async function requestsFor(userId: string) {
  if (!db) return { incoming: [], sent: [] };
  const blocked = await blockedIds(userId);
  const [incoming, sent] = await Promise.all([
    db.partnerRequest.findMany({ where: { toId: userId, status: "pending", fromId: { notIn: blocked } }, orderBy: { createdAt: "desc" }, include: { from: { select: personSelect } } }),
    db.partnerRequest.findMany({ where: { fromId: userId, status: { in: ["pending", "declined"] }, toId: { notIn: blocked } }, orderBy: { createdAt: "desc" }, include: { to: { select: personSelect } } }),
  ]);
  return {
    incoming: incoming.map((r) => ({ id: r.id, message: r.message, createdAt: r.createdAt.toISOString(), person: personCard(r.from) })),
    // A declined request shows as "Not available" to the sender. Nothing more is revealed.
    sent: sent.map((r) => ({ id: r.id, message: r.message, createdAt: r.createdAt.toISOString(), status: r.status === "declined" ? "unavailable" as const : "pending" as const, person: personCard(r.to) })),
  };
}
