import type { Metadata } from "next";
import { adminOr404 } from "@/lib/auth/admin";
import { AdminHeader } from "@/components/admin/ui";
import { OfferForm } from "@/components/admin/offer-form";

export const metadata: Metadata = { title: "New offer" };

export default async function NewOffer() {
  await adminOr404();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <AdminHeader title="New offer" />
      <OfferForm used={0} initial={{ code: "", title: "", blurb: "", kind: "flat", value: 0, minSpend: null, maxDiscount: null, validFrom: today, validTill: "", appliesTo: "all", tone: "coral", active: false, usageLimit: null }} />
    </>
  );
}
