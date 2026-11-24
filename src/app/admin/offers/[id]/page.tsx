import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader } from "@/components/admin/ui";
import { OfferForm } from "@/components/admin/offer-form";

export const metadata: Metadata = { title: "Edit offer" };

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function EditOffer({ params }: PageProps<"/admin/offers/[id]">) {
  await adminOr404();
  const o = await db!.offer.findUnique({ where: { id: (await params).id } });
  if (!o) notFound();
  return (
    <>
      <AdminHeader title={o.code} blurb={o.title} />
      <OfferForm used={o.usedCount} initial={{
        id: o.id, code: o.code, title: o.title, blurb: o.blurb, kind: o.kind, value: o.value, minSpend: o.minSpend, maxDiscount: o.maxDiscount,
        validFrom: iso(o.validFrom), validTill: iso(o.validTill), appliesTo: o.appliesTo as "all", tone: o.tone as "coral", active: o.active, usageLimit: o.usageLimit,
      }} />
    </>
  );
}
