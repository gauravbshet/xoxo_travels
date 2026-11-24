import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { clerkEnabled } from "./config";
import { normalizeEmail, upsertClerkUser } from "./user-sync";

/**
 * The signed-in user's DB row (with profile), or null.
 * Creates the row on first sight so the Clerk webhook isn't a hard dependency.
 */
export async function getCurrentUser() {
  if (!clerkEnabled || !db) return null;
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

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
}

/** Throws a Next.js redirect-friendly error if not an admin. Use in admin routes. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("ADMIN_REQUIRED");
  return user;
}
