import { ImageResponse } from "next/og";
import { OgCard, ogContentType, ogFonts, ogSize } from "@/lib/og";

export const alt = "XOXO Travels — holiday packages, group trips and travel partners";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return new ImageResponse(
    <OgCard eyebrow="Holidays · Group trips · Travel partners" title="Plan less. Travel more." footer="Domestic and international packages from ₹12,999" />,
    { ...size, fonts: await ogFonts() },
  );
}
