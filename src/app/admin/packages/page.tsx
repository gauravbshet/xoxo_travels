import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { Badge, Button } from "@/components/ui";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Packages" };

export default async function AdminPackages({ searchParams }: PageProps<"/admin/packages">) {
  await adminOr404();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const rows = await db!.package.findMany({
    where: q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }, { destination: { name: { contains: q, mode: "insensitive" } } }] } : undefined,
    orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
    select: { id: true, slug: true, title: true, nights: true, price: true, active: true, featured: true, bestseller: true, itinerary: true, destination: { select: { name: true } }, _count: { select: { bookings: true } } },
  });

  return (
    <>
      <AdminHeader title="Packages" blurb={`${rows.length} ${rows.length === 1 ? "package" : "packages"}${q ? ` matching "${q}"` : ""}. Inactive packages are hidden from the site.`}
        action={<Button href="/admin/packages/new">New package</Button>} />
      <form className="mb-4 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">Search packages</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search title, slug or destination" className="h-10 w-full max-w-sm rounded-md border border-line bg-paper px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100" />
        <Button type="submit" variant="outline" size="sm" className="h-10">Search</Button>
      </form>
      {rows.length === 0 ? <Panel className="p-6 text-center text-ink-soft">No packages found.</Panel> : (
        <Table>
          <thead><tr><th className={th}>Package</th><th className={th}>Destination</th><th className={th}>Nights</th><th className={th}>Price</th><th className={th}>Bookings</th><th className={th}>Status</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className={p.active ? "" : "bg-cream/60"}>
                <td className={td}>
                  <Link href={`/admin/packages/${p.id}`} className="font-semibold text-ink hover:text-sky-600">{p.title}</Link>
                  <p className="font-mono text-xs text-ink-mute">{p.slug}</p>
                </td>
                <td className={td}>{p.destination.name}</td>
                <td className={`${td} tabular`}>{p.nights}</td>
                <td className={`${td} tabular`}>{formatINR(p.price)}</td>
                <td className={`${td} tabular`}>{p._count.bookings}</td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1">
                    {p.active ? <Badge tone="green">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
                    {p.featured && <Badge tone="blue">Featured</Badge>}
                    {p.bestseller && <Badge tone="yellow">Bestseller</Badge>}
                    {!p.itinerary && <Badge>Default itinerary</Badge>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
