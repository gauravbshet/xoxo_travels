import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader, Pager, Panel, Table, td, th } from "@/components/admin/ui";
import { Badge, Button } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Customers" };
const PER_PAGE = 25;

export default async function AdminCustomers({ searchParams }: PageProps<"/admin/customers">) {
  await adminOr404();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.UserWhereInput = {
    clerkId: { not: { startsWith: "seed_" } },
    ...(q && { OR: [{ email: { contains: q, mode: "insensitive" } }, { profile: { displayName: { contains: q, mode: "insensitive" } } }, { profile: { city: { contains: q, mode: "insensitive" } } }] }),
  };
  const [total, rows] = await Promise.all([
    db!.user.count({ where }),
    db!.user.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE,
      select: { id: true, email: true, role: true, createdAt: true, profile: { select: { displayName: true, city: true, verified: true, discoverable: true } },
        _count: { select: { bookings: true, reportsGot: true } } },
    }),
  ]);
  const hrefFor = (p: number) => { const n = new URLSearchParams(q ? { q } : {}); if (p > 1) n.set("page", String(p)); return `/admin/customers${n.size ? `?${n}` : ""}`; };

  return (
    <>
      <AdminHeader title="Customers" blurb={`${total} signed-up travelers.`} />
      <form className="mb-4 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">Search customers</label>
        <input id="q" name="q" defaultValue={q} placeholder="Email, name or city" className="h-10 w-full max-w-sm rounded-md border border-line bg-paper px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100" />
        <Button type="submit" variant="outline" size="sm" className="h-10">Search</Button>
      </form>
      {rows.length === 0 ? <Panel className="p-6 text-center text-ink-soft">No customers found.</Panel> : (
        <Table>
          <thead><tr><th className={th}>Traveler</th><th className={th}>City</th><th className={th}>Joined</th><th className={th}>Bookings</th><th className={th}>Reports</th><th className={th}>Status</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td className={td}><Link href={`/admin/customers/${u.id}`} className="font-semibold text-ink hover:text-sky-600">{u.profile?.displayName ?? "—"}</Link><p className="text-xs text-ink-mute">{u.email}</p></td>
                <td className={td}>{u.profile?.city ?? "—"}</td>
                <td className={td}>{formatDate(u.createdAt.toISOString())}</td>
                <td className={`${td} tabular`}>{u._count.bookings}</td>
                <td className={`${td} tabular`}>{u._count.reportsGot ? <span className="font-semibold text-coral-700">{u._count.reportsGot}</span> : 0}</td>
                <td className={td}><div className="flex flex-wrap gap-1">
                  {u.role === "admin" && <Badge tone="blue">Admin</Badge>}
                  {u.profile?.verified && <Badge tone="trust">Verified</Badge>}
                  {u.profile?.discoverable && <Badge>In Find a Partner</Badge>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pager page={page} pages={Math.ceil(total / PER_PAGE)} hrefFor={hrefFor} />
    </>
  );
}
