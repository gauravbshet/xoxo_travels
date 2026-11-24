import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { Badge, Button } from "@/components/ui";
import { formatDate, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Offers" };

export default async function AdminOffers() {
  await adminOr404();
  const rows = await db!.offer.findMany({ orderBy: [{ active: "desc" }, { validTill: "asc" }] });
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <AdminHeader title="Offers" blurb="Coupon codes accepted at checkout." action={<Button href="/admin/offers/new">New offer</Button>} />
      {rows.length === 0 ? <Panel className="p-6 text-center text-ink-soft">No offers yet.</Panel> : (
        <Table>
          <thead><tr><th className={th}>Code</th><th className={th}>Discount</th><th className={th}>Applies to</th><th className={th}>Valid till</th><th className={th}>Used</th><th className={th}>Status</th></tr></thead>
          <tbody>
            {rows.map((o) => {
              const expired = o.validTill.toISOString().slice(0, 10) < today;
              const usedUp = o.usageLimit !== null && o.usedCount >= o.usageLimit;
              return (
                <tr key={o.id}>
                  <td className={td}><Link href={`/admin/offers/${o.id}`} className="font-mono font-semibold text-sky-600 hover:underline">{o.code}</Link><p className="text-xs text-ink-mute">{o.title}</p></td>
                  <td className={td}>{o.kind === "percent" ? `${o.value}%${o.maxDiscount ? ` (max ${formatINR(o.maxDiscount)})` : ""}` : formatINR(o.value)}{o.minSpend ? <p className="text-xs text-ink-mute">min {formatINR(o.minSpend)}</p> : null}</td>
                  <td className={td}>{o.appliesTo}</td>
                  <td className={td}>{formatDate(o.validTill.toISOString())}</td>
                  <td className={`${td} tabular`}>{o.usedCount}{o.usageLimit ? ` / ${o.usageLimit}` : ""}</td>
                  <td className={td}>{expired ? <Badge tone="neutral">Expired</Badge> : usedUp ? <Badge tone="neutral">Used up</Badge> : o.active ? <Badge tone="green">Active</Badge> : <Badge tone="neutral">Off</Badge>}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
