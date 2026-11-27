import "server-only";
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { clerkEnabled } from "./config";
import { normalizeEmail, roleForEmail, upsertClerkUser } from "./user-sync";

/**
 * The signed-in user's DB row (with profile), or null.
 *
 * Fast path (almost every request): one indexed read, no transaction and no
 * Clerk API call. The admin role is re-checked locally against ADMIN_EMAILS.
 * Slow path (first sign-in, or no profile yet): fetch the Clerk user and run
 * the full sync, so the Clerk webhook isn't a hard dependency.
 * Wrapped in React cache(), so a page calls the database once per request.
 */
export const getCurrentUser = cache(async () => {
  if (!clerkEnabled || !db) return null;
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const existing = await db.user.findUnique({ where: { clerkId }, include: { profile: true } });
  if (existing?.profile && !existing.email.endsWith("@placeholder.invalid")) {
    const role = roleForEmail(existing.email);
    if (role === existing.role) return existing;
    return db.user.update({ where: { id: existing.id }, data: { role }, include: { profile: true } });
  }

  const cu = await currentUser();
  if (!cu) return null;

  // Prefer the primary address, then any other; remember whether Clerk verified it.
  const addresses = [cu.primaryEmailAddress, ...cu.emailAddresses].filter((a): a is NonNullable<typeof a> => Boolean(a));
  const chosen = addresses.find((a) => normalizeEmail(a.emailAddress) !== null);
  const email = chosen?.emailAddress;
  const emailVerified = chosen?.verification?.status === "verified";
  const name = [cu.firstName, cu.lastName].filter(Boolean).join(" ") || cu.username;

  return upsertClerkUser({
    clerkId,
    email,
    emailVerified,
    name,
    phone: cu.primaryPhoneNumber?.phoneNumber,
  });
});

/** Throws a Next.js redirect-friendly error if not an admin. Use in admin routes. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("ADMIN_REQUIRED");
  return user;
}
