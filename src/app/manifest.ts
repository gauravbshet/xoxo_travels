import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "XOXO",
    description: "Holiday packages, group trips and travel partners across India and the world.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8f3",
    theme_color: "#16d69a",
    icons: [
      { src: "/logo.png", sizes: "any", type: "image/png" },
    ],
  };
}
