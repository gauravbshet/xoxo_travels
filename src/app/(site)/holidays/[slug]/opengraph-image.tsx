import { ImageResponse } from "next/og";
import { OgCard, ogContentType, ogFonts, ogSize } from "@/lib/og";
import { getAllPackageSlugs, getPackageDetail } from "@/lib/data/package-details";
import { formatDuration, formatINR } from "@/lib/format";

export const alt = "Holiday package on XOXO Travels";
export const size = ogSize;
export const contentType = ogContentType;

export async function generateStaticParams() {
  return (await getAllPackageSlugs()).map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const res = await getPackageDetail((await params).slug);
  const p = res?.pkg;
  return new ImageResponse(
    <OgCard
      eyebrow={p ? `${p.destinationName} · ${formatDuration(p.nights, p.days)}` : "Holiday packages"}
      title={p?.title ?? "Holiday packages"}
      footer={p ? `From ${formatINR(p.price)} per person${p.reviewCount ? ` · rated ${p.rating.toFixed(1)} / 5` : ""}` : "Packages across India and abroad"}
    />,
    { ...size, fonts: await ogFonts() },
  );
}
