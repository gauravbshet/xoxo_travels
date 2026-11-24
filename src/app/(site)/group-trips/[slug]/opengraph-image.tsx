import { ImageResponse } from "next/og";
import { OgCard, ogContentType, ogFonts, ogSize } from "@/lib/og";
import { getAllGroupTripSlugs, getGroupTripDetail } from "@/lib/data/group-trips";
import { formatDateRange, formatINR } from "@/lib/format";

export const alt = "Group trip on XOXO Travels";
export const size = ogSize;
export const contentType = ogContentType;

export async function generateStaticParams() {
  return (await getAllGroupTripSlugs()).map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const res = await getGroupTripDetail((await params).slug);
  const t = res?.trip;
  return new ImageResponse(
    <OgCard
      eyebrow={t ? `${t.destinationName} · ${formatDateRange(t.startDate, t.endDate)}` : "Group trips"}
      title={t?.title ?? "Group trips"}
      footer={t ? `From ${formatINR(t.price)} per person · led by ${t.leader}` : "Small-group trips with a trip leader"}
    />,
    { ...size, fonts: await ogFonts() },
  );
}
