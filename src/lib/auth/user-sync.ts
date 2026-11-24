import { z } from "zod";
import { db } from "@/lib/db";

const emailSchema = z.email();

export function normalizeEmail(email: string | null | undefined): string | null {
  const value = email?.trim();
  if (!value || !emailSchema.safeParse(value).success) return null;
  return value.toLowerCase();
}

function roleForEmail(email: string): "admin" | "user" {
  const admins = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map(normalizeEmail)
      .filter((value): value is string => value !== null),
  );
  return admins.has(email) ? "admin" : "user";
}

export async function upsertClerkUser(input: {
  clerkId: string;
  email?: string | null;
  /** True only when Clerk has verified the email. Needed to re-link an existing row by email. */
  emailVerified?: boolean;
  name?: string | null;
  phone?: string | null;
}) {
  if (!db) return null;

  const clerkId = input.clerkId.trim();
  if (!clerkId) throw new Error("Clerk user ID is required.");

  return db.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { clerkId },
      select: { email: true },
    });
    const normalizedEmail = normalizeEmail(input.email);

    // A row with this email but another Clerk ID: the same person on a new Clerk
    // account (deleted and re-created, or a new Clerk instance). Re-link it when
    // Clerk has verified the email; otherwise never take over another row's email.
    let usableEmail = normalizedEmail;
    if (normalizedEmail && normalizeEmail(existing?.email) !== normalizedEmail) {
      const owner = await tx.user.findUnique({ where: { email: normalizedEmail }, select: { id: true, clerkId: true } });
      if (owner && owner.clerkId !== clerkId) {
        if (input.emailVerified && !existing) {
          await tx.user.update({ where: { id: owner.id }, data: { clerkId } });
          console.info(`[auth] re-linked user ${owner.id} to a new Clerk account (verified email match)`);
        } else {
          usableEmail = null;
        }
      }
    }

    const email = usableEmail ?? normalizeEmail(existing?.email) ?? `${clerkId}@placeholder.invalid`;
    const role = usableEmail ? roleForEmail(usableEmail) : "user";
    const displayName = input.name?.trim() || "Traveler";

    const user = await tx.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        email,
        phone: input.phone ?? null,
        role,
      },
      update: {
        email,
        phone: input.phone ?? null,
        role,
      },
    });

    await tx.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, displayName, interests: [], languages: [] },
      update: input.name?.trim() ? { displayName } : {},
    });

    return tx.user.findUnique({
      where: { clerkId },
      include: { profile: true },
    });
  });
}
