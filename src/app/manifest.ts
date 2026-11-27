import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "XOXO",
    description: "Holiday packages, group trips and travel partners across India and the world.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf8",
    theme_color: "#0a6b52",
    icons: [
      { src: "/logo.png", sizes: "any", type: "image/png" },
    ],
  };
}
