import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { Badge, Button } from "@/components/ui";

export const metadata: Metadata = { title: "Destinations" };

export default async function AdminDestinations() {
  await adminOr404();
  const rows = await db!.destination.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, area: true, region: true, featured: true, _count: { select: { packages: true, groupTrips: true } } },
  });
  return (
    <>
      <AdminHeader title="Destinations" blurb={`${rows.length} destinations.`} action={<Button href="/admin/destinations/new">New destination</Button>} />
      {rows.length === 0 ? <Panel className="p-6 text-center text-ink-soft">No destinations yet.</Panel> : (
        <Table>
          <thead><tr><th className={th}>Destination</th><th className={th}>Area</th><th className={th}>Region</th><th className={th}>Packages</th><th className={th}>Group trips</th><th className={th}></th></tr></thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id}>
                <td className={td}><Link href={`/admin/destinations/${d.id}`} className="font-semibold text-ink hover:text-sky-600">{d.name}</Link><p className="font-mono text-xs text-ink-mute">{d.slug}</p></td>
                <td className={td}>{d.area}</td>
                <td className={td}>{d.region === "domestic" ? "India" : "International"}</td>
                <td className={`${td} tabular`}>{d._count.packages}</td>
                <td className={`${td} tabular`}>{d._count.groupTrips}</td>
                <td className={td}>{d.featured && <Badge tone="blue">Featured</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
