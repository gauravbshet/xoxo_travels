import { ImageResponse } from "next/og";
import { OgCard, ogContentType, ogFonts, ogSize } from "@/lib/og";
import { getAllDestinationSlugs, getDestinationBySlug } from "@/lib/data/destinations";
import { formatINR } from "@/lib/format";

export const alt = "Holiday packages on XOXO Travels";
export const size = ogSize;
export const contentType = ogContentType;

export async function generateStaticParams() {
  return (await getAllDestinationSlugs()).map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const d = await getDestinationBySlug((await params).slug);
  const title = d ? `${d.name}` : "Destinations";
  const footer = d ? `${d.packageCount} packages${d.fromPrice ? ` · from ${formatINR(d.fromPrice)}` : ""} · best ${d.bestMonths}` : "Packages across India and abroad";
  return new ImageResponse(
    <OgCard eyebrow={d ? `${d.area} · ${d.tagline}` : "Explore"} title={title} footer={footer} />,
    { ...size, fonts: await ogFonts() },
  );
}
