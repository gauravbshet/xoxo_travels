import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizeEmail, upsertClerkUser } from "@/lib/auth/user-sync";

/**
 * Clerk → DB sync. Configure in Clerk dashboard: Webhooks → endpoint
 * https://<domain>/api/webhooks/clerk, events user.created, user.updated, user.deleted.
 */
const envelopeSchema = z.object({ type: z.string().min(1), data: z.unknown() });
const userDataSchema = z.object({
  id: z.string().min(1),
  email_addresses: z.array(z.object({ id: z.string(), email_address: z.string(), verification: z.object({ status: z.string().nullish() }).nullish() })).nullish(),
  primary_email_address_id: z.string().nullable().optional(),
  phone_numbers: z.array(z.object({ id: z.string(), phone_number: z.string() })).nullish(),
  primary_phone_number_id: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
});
const deletedUserSchema = z.object({ id: z.string().min(1) });

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not set" }, { status: 500 });
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const svixId = req.headers.get("svix-id");
  const svixTs = req.headers.get("svix-timestamp");
  const svixSig = req.headers.get("svix-signature");
  if (!svixId || !svixTs || !svixSig) return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });

  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTs,
      "svix-signature": svixSig,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const envelope = envelopeSchema.safeParse(payload);
  if (!envelope.success) return NextResponse.json({ error: "Malformed webhook event" }, { status: 400 });

  if (envelope.data.type === "user.deleted") {
    const deletedUser = deletedUserSchema.safeParse(envelope.data.data);
    if (!deletedUser.success) return NextResponse.json({ error: "Malformed deleted-user event" }, { status: 400 });
    await db.user.deleteMany({ where: { clerkId: deletedUser.data.id } });
    return NextResponse.json({ ok: true });
  }

  if (envelope.data.type !== "user.created" && envelope.data.type !== "user.updated") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const parsedUser = userDataSchema.safeParse(envelope.data.data);
  if (!parsedUser.success) return NextResponse.json({ error: "Malformed user event" }, { status: 400 });

  const user = parsedUser.data;
  const emailAddresses = user.email_addresses ?? [];
  const primaryEmail = emailAddresses.find((address) => address.id === user.primary_email_address_id);
  const chosen = [primaryEmail, ...emailAddresses].find((address) => address && normalizeEmail(address.email_address) !== null);
  const email = chosen?.email_address;
  const emailVerified = chosen?.verification?.status === "verified";
  const phoneNumbers = user.phone_numbers ?? [];
  const phone = phoneNumbers.find((number) => number.id === user.primary_phone_number_id)?.phone_number;
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;

  await upsertClerkUser({ clerkId: user.id, email, emailVerified, name, phone });
  return NextResponse.json({ ok: true });
}
