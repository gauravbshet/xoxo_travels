import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

/* CSV of a trip's waitlist, for admins. Cells are escaped, and values that a
   spreadsheet would run as a formula (=, +, -, @) are prefixed so they stay text. */
const cell = (v: string | number) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(_req: Request, ctx: RouteContext<"/admin/group-trips/[id]/waitlist">) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin" || !db) return new Response("Not found", { status: 404 });
  const { id } = await ctx.params;
  const trip = await db.groupTrip.findUnique({ where: { id }, select: { slug: true, waitlist: { orderBy: { createdAt: "asc" }, select: { name: true, email: true, travelers: true, createdAt: true } } } });
  if (!trip) return new Response("Not found", { status: 404 });
  const rows = [["Name", "Email", "Seats", "Joined"], ...trip.waitlist.map((w) => [w.name, w.email, w.travelers, w.createdAt.toISOString().slice(0, 10)])];
  const csv = rows.map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(`﻿${csv}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="waitlist-${trip.slug}.csv"`, "Cache-Control": "no-store" },
  });
}
