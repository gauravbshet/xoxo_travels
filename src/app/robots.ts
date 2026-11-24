import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production";
  return {
    // Preview deployments stay out of search results.
    rules: isProd
      ? { userAgent: "*", allow: "/", disallow: ["/account", "/admin", "/api/", "/chat", "/partners", "/dev", "/holidays/compare", "/checkout", "/sign-in", "/sign-up"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
